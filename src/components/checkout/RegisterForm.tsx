'use client';
import type { User } from '@supabase/supabase-js';
import { AuthForm } from '@/components/auth/AuthForm';
export function RegisterForm({onSuccess}:{onSuccess:(user:User)=>void}) { return <AuthForm mode="signUp" checkout onSuccess={onSuccess}/>; }
