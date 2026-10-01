import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import SessionProvider from '../session/SessionProvider';
import { useSession } from '../session/useSession';
import { Stars, Wordmark } from '../components/brand';
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
        <div className="text-right text-sm text-bark">
            {session.status === 'loading' && <span>Checking your session.</span>}
            {session.status === 'signedOut' && pathname !== '/sign-in' && (
                <Link className={`${smallButtonClass} bg-paper`} to={signInPath(pathname + search)}>
                    Sign in
                </Link>
            )}
            {session.status === 'signedOut' && pathname === '/sign-in' && <span className="rounded-full bg-paper px-3 py-1.5">Not signed in</span>}
            {session.status === 'signedIn' && (
                <div className="flex items-center justify-end gap-2">
                    <span className="max-w-36 truncate" title={session.email}>
                        Signed in as {session.email}
                    </span>
                    <button type="button" className={`${smallButtonClass} bg-paper`} onClick={handleSignOut}>
                        Sign out
                    </button>
                </div>
            )}
            {signOutError && (
                <p role="alert" className="mt-1 font-semibold text-error">
                    {signOutError}
                </p>
            )}
        </div>
    );
};

const AppLayout = () => {
    return (
        <SessionProvider>
            <div className="min-h-screen overflow-x-hidden bg-paper font-sans text-ink antialiased">
                <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10">
                    {/* the sun by day, the moon by night */}
                    <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-28 size-56">
                        <div className="absolute inset-0 rounded-full bg-orb motion-safe:animate-float dark:shadow-[0_0_80px_10px_rgba(242,227,198,.18)]" />
                        <div className="absolute -inset-8 rounded-full border-[2.5px] border-dashed border-sun motion-safe:animate-spin-slow dark:opacity-40" />
                    </div>
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24">
                        <Stars points={[[42, 6], [58, 22], [50, 2], [64, 12]]} />
                    </div>
                    <header className="relative flex items-center justify-between gap-3 py-5">
                        <Link to="/" aria-label="face2sun, nearby places" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dusk">
                            <Wordmark />
                        </Link>
                        <SessionBar />
                    </header>
                    <main className="relative flex-1">
                        <Outlet />
                    </main>
                </div>
            </div>
        </SessionProvider>
    );
};

export default AppLayout;
