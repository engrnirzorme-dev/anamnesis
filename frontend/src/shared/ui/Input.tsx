import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

/**
 * Textовый input. Применяет класс `.form-input` of app.css.
 *
 * Работает и с react-hook-form, и с контролируемыми useState:
 * ```tsx
 * // RHF:
 * <Input {...register('name')} placeholder="Name" />
 * // Контролируемый:
 * <Input value={query} onChange={e => setQuery(e.target.value)} />
 * ```
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      className={clsx('form-input', invalid && 'form-input-invalid', className)}
      {...rest}
    />
  );
}
