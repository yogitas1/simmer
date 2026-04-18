/**
 * In-memory job store for MVP.
 * In production, replace with Supabase or Redis.
 */
import { GenerationJob } from "@/types/recipe";

// Use globalThis to survive Next.js hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __jobStore: Map<string, GenerationJob> | undefined;
}

function getStore(): Map<string, GenerationJob> {
  if (!globalThis.__jobStore) {
    globalThis.__jobStore = new Map();
  }
  return globalThis.__jobStore;
}

export function createJob(job: GenerationJob): void {
  getStore().set(job.id, job);
}

export function getJob(id: string): GenerationJob | undefined {
  return getStore().get(id);
}

export function updateJob(id: string, patch: Partial<GenerationJob>): void {
  const store = getStore();
  const existing = store.get(id);
  if (existing) {
    store.set(id, { ...existing, ...patch, updated_at: Date.now() });
  }
}
