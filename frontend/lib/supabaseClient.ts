// 本地认证客户端 - 兼容原 Supabase 接口，减少组件改动量
export const supabase = {
  auth: {
    getSession: async () => {
      const token = localStorage.getItem('local_auth_token');
      if (!token) return { data: { session: null } };
      return { 
        data: { 
          session: { 
            access_token: token,
            user: { id: 'local-user', email: '' }
          } 
        } 
      };
    },
    getUser: async () => {
      const token = localStorage.getItem('local_auth_token');
      if (!token) return { data: { user: null } };
      return {
        data: {
          user: { id: 'local-user', email: '本地用户' }
        }
      };
    },
    signOut: async () => {
      localStorage.removeItem('local_auth_token');
      return { error: null };
    },
    // 以下方法仅为兼容旧代码，不再实际调用 Supabase
    signUp: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: { message: data.detail } };
      localStorage.setItem('local_auth_token', data.access_token);
      return { data: { user: { id: 'local-user' }, session: { access_token: data.access_token } }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: { message: data.detail } };
      localStorage.setItem('local_auth_token', data.access_token);
      return { data: { user: { id: 'local-user' }, session: { access_token: data.access_token } }, error: null };
    }
  }
};