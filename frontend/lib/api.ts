import { supabase } from './supabaseClient';
import { CONFIG } from './config';   // 👈 引入统一配置

export async function fetchWithAuth(
  endpoint: string,        // 只传接口路径，如 /cards
  options: RequestInit = {}
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = CONFIG.redirect.login; // 👈 用配置
    return;
  }

  let url = endpoint;
  if (!url.startsWith('/api/knowledge')) {
    url = `/api/knowledge${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };

  return fetch(url, { ...options, headers });
}