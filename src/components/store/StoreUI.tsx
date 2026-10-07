'use client';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
export const BUTTON = 'flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
export function Button({variant='primary',className,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'}) { return <button className={cn(BUTTON,variant==='primary'?'bg-[#2563EB] text-white hover:bg-blue-700':'border border-border-editorial hover:border-accent-cyan text-text-primary',className)} {...props}/>; }
export const FIELD = 'min-h-12 w-full border border-border-editorial bg-[#0F172A] px-4 py-3 text-base text-text-primary placeholder:text-text-secondary focus:border-accent-cyan disabled:opacity-50';
export const Input = forwardRef<HTMLInputElement,InputHTMLAttributes<HTMLInputElement>>(function Input({className,...props},ref) { return <input ref={ref} className={cn(FIELD,className)} {...props}/>; });
export function Select({className,...props}:SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn(FIELD,className)} {...props}/>; }
export function Field({id,label,children}: {id:string;label:string;children:ReactNode}) { return <div><label className="mb-2 block text-sm font-medium" htmlFor={id}>{label}</label>{children}</div>; }
export function Spinner({label}: {label:string}) { return <div role="status" className="flex min-h-[60svh] items-center justify-center gap-3 px-5 text-text-secondary"><LoaderCircle className="animate-spin motion-reduce:animate-none" size={24} aria-hidden="true"/>{label}</div>; }
export function Toast({message,error=false}: {message:string;error?:boolean}) { if(!message)return null;return <p role={error?'alert':'status'} className={cn('border px-4 py-3 text-sm leading-relaxed',error?'border-red-400/40 text-red-300':'border-accent-cyan/40 text-accent-cyan')}>{message}</p>; }
