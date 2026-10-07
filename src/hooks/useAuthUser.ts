'use client';

import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { getAuthClient } from '@/lib/auth/client';

/** Estado visual; las operaciones privadas se validan en Supabase. */
export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};
    try {
      const client = getAuthClient();
      client.auth.getUser().then(({ data }) => {
        if (mounted) { setUser(data.user); setLoading(false); }
      }).catch(() => { if (mounted) { setUser(null); setLoading(false); } });
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        if (mounted) { setUser(session?.user ?? null); setLoading(false); }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch { queueMicrotask(() => { if (mounted) setLoading(false); }); }
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { user, loading };
}
