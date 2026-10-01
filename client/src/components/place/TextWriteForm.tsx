import { useId, useState, type FormEvent } from 'react';
import { buttonClass, errorTextClass, inputClass, labelClass } from '../ui';
import { hasFields, type WriteError } from './writeTypes';

type Props = {
    label: string;
    hint?: string;
    submitLabel: string;
    multiline?: boolean;
    pending: boolean;
    error: WriteError | undefined;
    onSubmit: (text: string) => Promise<boolean>;
};

const TextWriteForm = ({ label, hint, submitLabel, multiline = false, pending, error, onSubmit }: Props) => {
    const id = useId();
    const [text, setText] = useState('');
    const fieldError = error?.fields.text;
    const generalError = error && !hasFields(error) ? error.message : undefined;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (await onSubmit(text)) setText('');
    };

    const describedBy = fieldError ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
        <form onSubmit={handleSubmit} noValidate>
            <label className={labelClass} htmlFor={id}>
                {label}
            </label>
            {multiline ? (
                <textarea
                    id={id}
                    rows={3}
                    className={inputClass}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={describedBy}
                />
            ) : (
                <input
                    id={id}
                    type="text"
                    className={inputClass}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={describedBy}
                />
            )}
            {hint && !fieldError && (
                <p id={`${id}-hint`} className="mt-1 text-sm text-bark">
                    {hint}
                </p>
            )}
            {fieldError && (
                <p id={`${id}-error`} role="alert" className={errorTextClass}>
                    {fieldError}
                </p>
            )}
            {generalError && (
                <p role="alert" className={errorTextClass}>
                    {generalError}
                </p>
            )}
            <button type="submit" className={`${buttonClass} mt-3 w-full`} disabled={pending}>
                {pending ? 'Saving.' : submitLabel}
            </button>
        </form>
    );
};

export default TextWriteForm;
