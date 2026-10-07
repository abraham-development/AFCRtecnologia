import { getAuthClient } from './client';

export type AuthMethod = 'google' | 'password';
export interface MethodStatus { method: AuthMethod; pending: { id: string; target: AuthMethod; verified: boolean; expiresAt: string } | null; }

/** La Edge Function valida el JWT y consulta el control privado de sesiones. */
export async function authMethodOperation<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await getAuthClient().functions.invoke('auth-method', { body });
  if (error) {
    if (error.context instanceof Response) {
      const response = await error.context.json().catch(() => null);
      if (response?.error) throw new Error(response.error);
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
