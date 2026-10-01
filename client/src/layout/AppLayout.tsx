import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import SessionProvider from '../session/SessionProvider';
import { useSession } from '../session/useSession';
import { smallButtonClass } from '../components/ui';
import { signInPath } from '../lib/labels';

const SessionBar = () => {
    const { session, signOut } = useSession();
    const { pathname, search } = useLocation();
    const [signOutError, setSignOutError] = useState<string | null>(null);

    const handleSignOut = () => {
        setSignOutError(null);
        signOut().catch((err: unknown) => {
            setSignOutError(err instanceof Error ? err.message : 'Could not sign out.');
        });
    };

    return (
        <div className="text-right text-sm text-stone-800">
            {session.status === 'loading' && <span>Checking your session.</span>}
            {session.status === 'signedOut' && pathname !== '/sign-in' && (
                <Link className="font-medium underline" to={signInPath(pathname + search)}>
                    Sign in
                </Link>
            )}
            {session.status === 'signedOut' && pathname === '/sign-in' && <span>Not signed in</span>}
            {session.status === 'signedIn' && (
                <div className="flex items-center justify-end gap-2">
                    <span className="max-w-40 truncate" title={session.email}>
                        Signed in as {session.email}
                    </span>
                    <button type="button" className={smallButtonClass} onClick={handleSignOut}>
                        Sign out
                    </button>
                </div>
            )}
            {signOutError && (
                <p role="alert" className="mt-1 font-medium text-red-800">
                    {signOutError}
                </p>
            )}
        </div>
    );
};

const AppLayout = () => {
    return (
        <SessionProvider>
            <div className="min-h-screen bg-amber-50 font-sans text-stone-900">
                <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10">
                    <header className="flex items-center justify-between gap-3 py-4">
                        <Link to="/" className="text-xl font-bold tracking-tight">
                            Face2Sun
                        </Link>
                        <SessionBar />
                    </header>
                    <main className="flex-1">
                        <Outlet />
                    </main>
                </div>
            </div>
        </SessionProvider>
    );
};

export default AppLayout;
