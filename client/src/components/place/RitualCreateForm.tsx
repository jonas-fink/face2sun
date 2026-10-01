import { useId, useState, type FormEvent } from 'react';
import type { CreateRitualInput } from '../../api/face2sun';
import { buttonClass, errorTextClass, inputClass, labelClass } from '../ui';
import { hasFields, type WriteError } from './writeTypes';

type Props = {
    pending: boolean;
    error: WriteError | undefined;
    onSubmit: (input: CreateRitualInput) => Promise<boolean>;
};

const RitualCreateForm = ({ pending, error, onSubmit }: Props) => {
    const id = useId();
    const [title, setTitle] = useState('');
    const [recurrence, setRecurrence] = useState('');
    const [cap, setCap] = useState('4');

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const ok = await onSubmit({ title, recurrence, cap: cap.trim() === '' ? Number.NaN : Number(cap) });
        if (ok) {
            setTitle('');
            setRecurrence('');
            setCap('4');
        }
    };

    const generalError = error && !hasFields(error) ? error.message : undefined;

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div>
                <label className={labelClass} htmlFor={`${id}-title`}>
                    Ritual title
                </label>
                <input
                    id={`${id}-title`}
                    type="text"
                    className={inputClass}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    aria-invalid={Boolean(error?.fields.title)}
                    aria-describedby={error?.fields.title ? `${id}-title-error` : undefined}
                />
                {error?.fields.title && (
                    <p id={`${id}-title-error`} role="alert" className={errorTextClass}>
                        {error.fields.title}
                    </p>
                )}
            </div>
            <div>
                <label className={labelClass} htmlFor={`${id}-recurrence`}>
                    How often
                </label>
                <input
                    id={`${id}-recurrence`}
                    type="text"
                    className={inputClass}
                    placeholder="Thursday late light"
                    value={recurrence}
                    onChange={(event) => setRecurrence(event.target.value)}
                    aria-invalid={Boolean(error?.fields.recurrence)}
                    aria-describedby={error?.fields.recurrence ? `${id}-recurrence-error` : undefined}
                />
                {error?.fields.recurrence && (
                    <p id={`${id}-recurrence-error`} role="alert" className={errorTextClass}>
                        {error.fields.recurrence}
                    </p>
                )}
            </div>
            <div>
                <label className={labelClass} htmlFor={`${id}-cap`}>
                    Spots (2 to 12)
                </label>
                <input
                    id={`${id}-cap`}
                    type="number"
                    inputMode="numeric"
                    className={inputClass}
                    value={cap}
                    onChange={(event) => setCap(event.target.value)}
                    aria-invalid={Boolean(error?.fields.cap)}
                    aria-describedby={error?.fields.cap ? `${id}-cap-error` : undefined}
                />
                {error?.fields.cap && (
                    <p id={`${id}-cap-error`} role="alert" className={errorTextClass}>
                        {error.fields.cap}
                    </p>
                )}
            </div>
            {generalError && (
                <p role="alert" className={errorTextClass}>
                    {generalError}
                </p>
            )}
            <button type="submit" className={`${buttonClass} w-full`} disabled={pending}>
                {pending ? 'Saving.' : 'Create ritual'}
            </button>
        </form>
    );
};

export default RitualCreateForm;
