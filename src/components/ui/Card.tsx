import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={clsx('bg-white shadow rounded-lg p-6', className)} {...props} />; }