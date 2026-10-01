import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ApiError, login, register } from '../api/face2sun';
import { Stars } from '../components/brand';
import { buttonClass, cardClass, displayClass, errorTextClass, inputClass, labelClass, secondaryButtonClass } from '../components/ui';
import { safeNextPath } from '../lib/labels';
import { useSession } from '../session/useSession';

type Mode = 'login' | 'register';

const SignInPage = () => {
    const { session, setSignedIn, signOut } = useSession();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = safeNextPath(params.get('next'));

    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<{ message: string; fields: Record<string, string> } | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
            const member = mode === 'login' ? await login(email, password) : await register(email, password);
            setSignedIn(member.email);
            void navigate(next, { replace: true });
        } catch (err) {
            setError(
                err instanceof ApiError
                    ? { message: err.message, fields: err.fields ?? {} }
                    : { message: 'Something went wrong. Try again.', fields: {} },
            );
        } finally {
            setPending(false);
        }
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError(null);
    };

    if (session.status === 'signedIn') {
        return (
            <section className={cardClass} aria-labelledby="signed-in-heading">
                <h1 id="signed-in-heading" className={`${displayClass} text-3xl`}>
                    You are signed in
                </h1>
                <p className="mt-2 text-bark">Signed in as {session.email}.</p>
                <div className="mt-4 flex gap-3">
                    <Link to={next} className={buttonClass}>
                        Continue
                    </Link>
                    <button type="button" className={secondaryButtonClass} onClick={() => void signOut()}>
                        Sign out
                    </button>
                </div>
            </section>
        );
    }

    const isLogin = mode === 'login';

    return (
        <section aria-labelledby="sign-in-heading" className="space-y-5">
            <div aria-hidden="true" className="relative -mx-4 h-56 overflow-hidden rounded-b-[48px] bg-cue-early">
                <Stars points={[[10, 25], [26, 12], [80, 30], [70, 10], [15, 60]]} />
                <div className="absolute top-14 left-1/2 size-44 -translate-x-1/2 motion-safe:animate-rise">
                    <div className="absolute -inset-6 rounded-full border-[2.5px] border-dashed border-ember motion-safe:animate-spin-slow" />
                    <div className="absolute inset-0 rounded-full bg-orb" />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-14 bg-hill" />
            </div>
            <h1 id="sign-in-heading" className={`${displayClass} text-4xl leading-none`}>
                {isLogin ? 'Sign in' : 'Create an account'}
            </h1>
            <p className="leading-relaxed text-bark">
                Browsing is open. Your name never shows anywhere. An account is needed to add a place, check in, write a moment, leave a light, or take a ritual spot.
            </p>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                    <label className={labelClass} htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className={inputClass}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-invalid={Boolean(error?.fields.email)}
                        aria-describedby={error?.fields.email ? 'email-error' : undefined}
                    />
                    {error?.fields.email && (
                        <p id="email-error" className={errorTextClass}>
                            {error.fields.email}
                        </p>
                    )}
                </div>
                <div>
                    <label className={labelClass} htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        className={inputClass}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={Boolean(error?.fields.password)}
                        aria-describedby={error?.fields.password ? 'password-error' : 'password-hint'}
                    />
                    {!isLogin && !error?.fields.password && (
                        <p id="password-hint" className="mt-1 text-sm text-bark">
                            8 to 72 characters.
                        </p>
                    )}
                    {error?.fields.password && (
                        <p id="password-error" className={errorTextClass}>
                            {error.fields.password}
                        </p>
                    )}
                </div>
                {error && (
                    <p role="alert" className={errorTextClass}>
                        {error.message}
                    </p>
                )}
                <button type="submit" className={`${buttonClass} w-full`} disabled={pending}>
                    {pending ? 'Please wait.' : isLogin ? 'Sign in' : 'Create account'}
                </button>
            </form>
            <button type="button" className="mx-auto block min-h-11 font-bold text-dusk underline" onClick={switchMode}>
                {isLogin ? 'New here? Create an account' : 'Have an account? Sign in'}
            </button>
        </section>
    );
};

export default SignInPage;
