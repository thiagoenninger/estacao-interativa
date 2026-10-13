import type { ReactNode } from 'react';
import { SessionContext } from './context';
import type { Session } from './session';

interface ExperienceProviderProps {
  session: Session;
  children: ReactNode;
}
export function ExperienceProvider({ session, children }: ExperienceProviderProps) {
  return <SessionContext value={session}>{children}</SessionContext>;
}
