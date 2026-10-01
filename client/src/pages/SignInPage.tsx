import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ApiError, login, register } from '../api/face2sun';
import { buttonClass, cardClass, errorTextClass, inputClass, labelClass, secondaryButtonClass } from '../components/ui';
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
                <h1 id="signed-in-heading" className="text-xl font-bold">
                    You are signed in
                </h1>
                <p className="mt-2 text-stone-800">Signed in as {session.email}.</p>
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
        <section className={cardClass} aria-labelledby="sign-in-heading">
            <h1 id="sign-in-heading" className="text-xl font-bold">
                {isLogin ? 'Sign in' : 'Create an account'}
            </h1>
            <p className="mt-1 text-sm text-stone-700">
                Browsing is open. An account is needed to add a place, check in, write a moment, leave a light, or take a ritual spot.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
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
                        <p id="password-hint" className="mt-1 text-sm text-stone-700">
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
            <button type="button" className="mt-4 min-h-11 text-sm font-medium underline" onClick={switchMode}>
                {isLogin ? 'New here? Create an account' : 'Have an account? Sign in'}
            </button>
        </section>
    );
};

export default SignInPage;
