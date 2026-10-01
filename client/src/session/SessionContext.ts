import { createContext } from 'react';

export type SessionState = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; email: string };

export type SessionValue = {
    session: SessionState;
    setSignedIn: (email: string) => void;
    setSignedOut: () => void;
    signOut: () => Promise<void>;
};

export const SessionContext = createContext<SessionValue | null>(null);
