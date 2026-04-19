import { createMiddleware } from "hono/factory";
import { verifyToken } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { db, users } from "@artifigenz/db";
import { clerkClient } from "./clerk-client";

type UserRow = typeof users.$inferSelect;

declare module "hono" {
  interface ContextVariableMap {
    user: UserRow;
    clerkUserId: string;
  }
}

export const clerkAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  let clerkId: string;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    clerkId = payload.sub;
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("clerkUserId", clerkId);

  // Look up user in our database
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  // Auto-create on first request (replaces the need for a Clerk webhook
  // during local dev; webhooks still work in parallel if configured).
  if (!user) {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const email =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
      const name = [clerkUser.firstName, clerkUser.lastName]
        .filter(Boolean)
        .join(" ");

      [user] = await db
        .insert(users)
        .values({
          clerkId,
          email,
          name: name || null,
          avatarUrl: clerkUser.imageUrl || null,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: { email, name: name || null, avatarUrl: clerkUser.imageUrl || null, updatedAt: new Date() },
        })
        .returning();
    } catch (err) {
      console.error("[clerkAuth] Failed to auto-create user:", err);
      return c.json({ error: "Failed to initialize user account" }, 500);
    }
  }

  c.set("user", user);
  await next();
});
