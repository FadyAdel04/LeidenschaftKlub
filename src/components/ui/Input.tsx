import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={clsx('w-full border border-gray-300 rounded-md px-3 py-2', className)} {...props} />; }