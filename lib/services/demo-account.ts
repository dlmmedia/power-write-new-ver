import { v4 as uuidv4 } from 'uuid';

export const DEMO_USER_ID = 'demo-user-001';

export interface DemoSession {
  userId: string;
  createdAt: string;
  booksGenerated: number;
  limitations: {
    maxBooks: number;
    maxChapters: number;
    maxWords: number;
  };
}

const DEMO_SESSION_KEY = 'powerwrite_demo_session';

export function getDemoSession(): DemoSession {
  if (typeof window === 'undefined') {
    // Server-side: return default session
    return createDefaultSession();
  }

  const stored = localStorage.getItem(DEMO_SESSION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing demo session:', error);
    }
  }

  // Create new session
  const session = createDefaultSession();
  saveDemoSession(session);
  return session;
}

export function saveDemoSession(session: DemoSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

export function updateDemoSession(updates: Partial<DemoSession>): DemoSession {
  const session = getDemoSession();
  const updated = { ...session, ...updates };
  saveDemoSession(updated);
  return updated;
}

export function incrementBooksGenerated(): DemoSession {
  const session = getDemoSession();
  const updated = {
    ...session,
    booksGenerated: session.booksGenerated + 1,
  };
  saveDemoSession(updated);
  return updated;
}

export function canGenerateBook(): { allowed: boolean; reason?: string } {
  const session = getDemoSession();

  if (session.booksGenerated >= session.limitations.maxBooks) {
    return {
      allowed: false,
      reason: `You've reached the demo limit of ${session.limitations.maxBooks} books. Please sign up for unlimited access.`,
    };
  }

  return { allowed: true };
}

export function clearDemoSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEMO_SESSION_KEY);
}

function createDefaultSession(): DemoSession {
  return {
    userId: DEMO_USER_ID,
    createdAt: new Date().toISOString(),
    booksGenerated: 0,
    limitations: {
      maxBooks: 5,
      maxChapters: 20,
      maxWords: 100000,
    },
  };
}

export function getDemoUserId(): string {
  return DEMO_USER_ID;
}
