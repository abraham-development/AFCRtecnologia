'use client';
import type { User } from '@supabase/supabase-js';
import { AuthForm } from '@/components/auth/AuthForm';
export function LoginForm({onSuccess}:{onSuccess:(user:User)=>void}) { return <AuthForm mode="signIn" checkout onSuccess={onSuccess}/>; }
