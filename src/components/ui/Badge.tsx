import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
export function Badge({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) { return <span className={clsx('px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800', className)} {...props}>{children}</span>; }