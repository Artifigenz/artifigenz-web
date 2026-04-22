'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useApiClient } from '@/hooks/useApiClient';

const VISIBLE_STATUSES = new Set(['active']);

export function agentSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export interface ActivationContext {
  /** agentInstance id (uuid) */
  id: string;
  /** agentTypeId (e.g. 'finance') — also used as the URL slug */
  slug: string;
  status: string;
  activatedAt: number;
  /** Kept for greeting.ts compatibility; always empty — connections live in their own endpoint. */
  accounts: string[];
  /** Backend stores a single goal string; we wrap it in an array for compatibility. */
  goals: string[];
  /** Kept for compatibility; fetch skills separately when needed. */
  skills: Record<string, boolean>;
}

interface InstanceDTO {
  id: string;
  agentTypeId: string;
  status: string;
  goal: string | null;
  lastAnalyzedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function instanceToContext(i: InstanceDTO): ActivationContext {
  return {
    id: i.id,
    slug: i.agentTypeId,
    status: i.status,
    activatedAt: i.createdAt ? new Date(i.createdAt).getTime() : 0,
    accounts: [],
    goals: i.goal ? [i.goal] : [],
    skills: {},
  };
}

export function useActivatedAgents() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApiClient();
  const [activations, setActivations] = useState<ActivationContext[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setActivations([]);
      setHydrated(true);
      return;
    }
    try {
      const instances = await api.getMyAgents();
      setActivations(
        instances
          .filter((i) => VISIBLE_STATUSES.has(i.status))
          .map(instanceToContext),
      );
    } catch {
      setActivations([]);
    } finally {
      setHydrated(true);
    }
  }, [api, isLoaded, isSignedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activate = useCallback(
    async (
      slug: string,
      opts?: { goal?: string; status?: 'active' | 'onboarding' },
    ) => {
      const inst = await api.getOrCreateAgentInstance(slug, opts);
      // If an instance already exists and the caller wants a different status
      // (e.g. an onboarding instance being promoted to active), patch it.
      let finalStatus = inst.status;
      if (opts?.status && opts.status !== inst.status) {
        const { agentInstance } = await api.updateAgentInstance(inst.id, {
          status: opts.status,
        });
        finalStatus = agentInstance.status;
      }
      await refresh();
      return instanceToContext({
        id: inst.id,
        agentTypeId: inst.agentTypeId,
        status: finalStatus,
        goal: inst.goal ?? null,
        lastAnalyzedAt: inst.lastAnalyzedAt ?? null,
        createdAt: (inst as { createdAt?: string | null }).createdAt ?? null,
        updatedAt: (inst as { updatedAt?: string | null }).updatedAt ?? null,
      });
    },
    [api, refresh],
  );

  const deactivate = useCallback(
    async (slug: string) => {
      const inst = activations.find((a) => a.slug === slug);
      if (!inst) return;
      await api.deactivateAgent(inst.id);
      await refresh();
    },
    [activations, api, refresh],
  );

  const isActivated = useCallback(
    (slug: string) => activations.some((a) => a.slug === slug),
    [activations],
  );

  const getActivation = useCallback(
    (slug: string) => activations.find((a) => a.slug === slug) ?? null,
    [activations],
  );

  const slugs = activations.map((a) => a.slug);

  return {
    activations,
    slugs,
    activate,
    deactivate,
    isActivated,
    getActivation,
    hydrated,
    refresh,
  };
}
