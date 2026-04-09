import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db, users } from "@artifigenz/db";
import { clerkAuth } from "../platform/auth/clerk-middleware";
import { clerkClient } from "../platform/auth/clerk-client";

const app = new Hono();

// All routes require auth
app.use("/*", clerkAuth);

// ─── GET /api/me — User profile ──────────────────────────────────
app.get("/", async (c) => {
  const user = c.get("user");
  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    locale: user.locale,
    currency: user.currency,
    onboardingCompleted: user.onboardingCompleted,
    chatCustomInstructions: user.chatCustomInstructions,
  });
});

// ─── PATCH /api/me — Update profile ──────────────────────────────
app.patch("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const allowed = [
    "name",
    "timezone",
    "locale",
    "currency",
    "onboardingCompleted",
    "chatCustomInstructions",
  ] as const;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, user.id))
    .returning();

  return c.json({ user: updated });
});

// ─── GET /api/me/chat/instructions ───────────────────────────────
app.get("/chat/instructions", async (c) => {
  const user = c.get("user");
  return c.json({ instructions: user.chatCustomInstructions ?? null });
});

// ─── PUT /api/me/chat/instructions ───────────────────────────────
app.put("/chat/instructions", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const instructions =
    typeof body.instructions === "string" && body.instructions.trim().length > 0
      ? body.instructions.trim().slice(0, 4000)
      : null;

  await db
    .update(users)
    .set({ chatCustomInstructions: instructions, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return c.body(null, 204);
});

// ─── POST /api/me/delete/request ─────────────────────────────────
// Generates a 6-digit code, stores it on the user row (10 min expiry),
// and emails it via Resend.
app.post("/delete/request", async (c) => {
  const user = c.get("user");

  if (!user.email) {
    return c.json({ error: "Account has no email to send verification to" }, 400);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db
    .update(users)
    .set({
      deletionCode: code,
      deletionCodeExpiresAt: expires,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const from = process.env.EMAIL_FROM ?? "Artifigenz <onboarding@resend.dev>";

    await resend.emails.send({
      from,
      to: user.email,
      subject: "Confirm account deletion",
      text: `Your Artifigenz account deletion code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email and your account will remain active.`,
      html: `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="font-size: 18px; margin: 0 0 16px; color: #111;">Confirm account deletion</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #333;">
            Your Artifigenz account deletion code is:
          </p>
          <p style="font-size: 28px; font-weight: 600; color: #111; letter-spacing: 0.1em; margin: 20px 0; font-family: monospace;">
            ${code}
          </p>
          <p style="font-size: 13px; line-height: 1.6; color: #666;">
            This code expires in 10 minutes. If you did not request this,
            ignore this email and your account will remain active.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[delete/request] Failed to send email:", err);
    return c.json({ error: "Failed to send verification email" }, 500);
  }

  return c.json({ sent: true });
});

// ─── POST /api/me/delete/confirm ─────────────────────────────────
// Verifies the code, deletes the user from our DB and from Clerk.
app.post("/delete/confirm", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const submittedCode = (body.code ?? "").toString().trim();

  if (!user.deletionCode || !user.deletionCodeExpiresAt) {
    return c.json({ error: "No deletion request in progress" }, 400);
  }

  if (new Date() > new Date(user.deletionCodeExpiresAt)) {
    return c.json({ error: "Code has expired. Request a new one." }, 400);
  }

  if (submittedCode !== user.deletionCode) {
    return c.json({ error: "Invalid code" }, 400);
  }

  // Delete from our DB first (cascades to agents, insights, everything)
  await db.delete(users).where(eq(users.id, user.id));

  // Then delete from Clerk so the session can't be reused
  try {
    await clerkClient.users.deleteUser(user.clerkId);
  } catch (err) {
    console.warn("[delete/confirm] Failed to delete Clerk user (already gone?):", err);
  }

  return c.body(null, 204);
});

// ─── DELETE /api/me — kept for admin/fallback, but prefer the verified flow ──
app.delete("/", async (c) => {
  const user = c.get("user");
  await db.delete(users).where(eq(users.id, user.id));
  try {
    await clerkClient.users.deleteUser(user.clerkId);
  } catch {
    // ignore
  }
  return c.body(null, 204);
});

export default app;
