import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { Session } from './session.ts';
import type { ExperienceStore } from './store.ts';

export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession needs an ExperienceProvider above it.');
  return session;
}
export function useExperience<T>(selector: (state: ExperienceStore) => T): T {
  return useStore(useSession().store, selector);
}
