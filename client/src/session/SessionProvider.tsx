import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe, logout } from '../api/face2sun';
import { SessionContext, type SessionState, type SessionValue } from './SessionContext';

const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<SessionState>({ status: 'loading' });

    useEffect(() => {
        let cancelled = false;
        getMe()
            .then(({ email }) => {
                if (!cancelled) setSession((current) => (current.status === 'loading' ? { status: 'signedIn', email } : current));
            })
            .catch(() => {
                if (!cancelled) setSession((current) => (current.status === 'loading' ? { status: 'signedOut' } : current));
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const setSignedIn = useCallback((email: string) => setSession({ status: 'signedIn', email }), []);
    const setSignedOut = useCallback(() => setSession({ status: 'signedOut' }), []);
    const signOut = useCallback(async () => {
        await logout();
        setSession({ status: 'signedOut' });
    }, []);

    const value = useMemo<SessionValue>(
        () => ({ session, setSignedIn, setSignedOut, signOut }),
        [session, setSignedIn, setSignedOut, signOut],
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export default SessionProvider;
