// lib/config.ts
export const CONFIG = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  api: {
    baseURL: process.env.NEXT_PUBLIC_API_BASE || '',
  },
  redirect: {
    login: '/login',
  },
} as const;