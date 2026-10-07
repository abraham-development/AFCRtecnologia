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
    let revision = 0;
    let initializing = true;
    let initialEvent = true;
    let unsubscribe = () => {};
    try {
      const client = getAuthClient();
      client.auth.getUser().then(({ data }) => {
        initializing = false;
        if (mounted && revision === 0) { setUser(data.user); setLoading(false); }
      }).catch(() => { initializing = false; if (mounted && revision === 0) { setUser(null); setLoading(false); } });
      const { data } = client.auth.onAuthStateChange((event, session) => {
        // La identidad inicial se resuelve con getUser, no con el usuario en caché.
        if (event === 'INITIAL_SESSION') { initialEvent = false; return; }
        // Supabase también emite SIGNED_IN al recuperar el usuario en caché.
        if (event === 'SIGNED_IN' && initializing && initialEvent) return;
        // Una respuesta inicial tardía no debe restaurar una sesión ya cerrada.
        revision += 1;
        if (mounted) { setUser(session?.user ?? null); setLoading(false); }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch { queueMicrotask(() => { if (mounted) setLoading(false); }); }
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return { user, loading };
}
