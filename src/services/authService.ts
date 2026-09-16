import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, Role } from '../types';

export interface AuthUserSession {
  user: any;
  profile: Profile | null;
}

export interface DefaultAdminAccount {
  email: string;
  password: string;
  name: string;
  role: Role;
  outletId?: string;
  description: string;
}

export const DEFAULT_ADMIN_ACCOUNTS: DefaultAdminAccount[] = [
  {
    email: 'admin@letoncoffee.id',
    password: 'letonadmin',
    name: 'Admin Pusat Leton',
    role: 'SUPER_ADMIN',
    description: 'Akses penuh ke semua outlet & pengaturan sistem pusat'
  },
  {
    email: 'sudirman@letoncoffee.id',
    password: 'letonadmin',
    name: 'Lead Barista Sudirman',
    role: 'OUTLET_ADMIN',
    outletId: 'sudirman',
    description: 'Akses operasional Chapter I (Jl. Sudirman)'
  },
  {
    email: 'kelakap@letoncoffee.id',
    password: 'letonadmin',
    name: 'Store Supervisor Kelakap 7',
    role: 'OUTLET_ADMIN',
    outletId: 'kelakap',
    description: 'Akses operasional Chapter II (Kelakap Tujuh / Ratusima)'
  },
  {
    email: 'letgo@letoncoffee.id',
    password: 'letonadmin',
    name: 'Barista Lead LET\'GO MPP',
    role: 'OUTLET_ADMIN',
    outletId: 'letgo',
    description: 'Akses operasional Chapter III (LET\'GO Express MPP)'
  }
];

const LOCAL_SESSION_KEY = 'leton_auth_session';
const authListeners: ((session: AuthUserSession | null) => void)[] = [];

function notifyAuthListeners(session: AuthUserSession | null) {
  authListeners.forEach((listener) => {
    try {
      listener(session);
    } catch (err) {
      console.error('Error in auth listener:', err);
    }
  });
}

export function normalizeOutletId(id?: string | null): string {
  if (!id) return '';
  const lower = id.toLowerCase().trim();
  if (lower.includes('sudirman') || lower === 'sdr') return 'sudirman';
  if (lower.includes('kelakap') || lower.includes('ratusima') || lower === 'rtm') return 'kelakap';
  if (lower.includes('letgo') || lower.includes('mpp') || lower === 'ltg') return 'letgo';
  return lower;
}

export function isOutletAuthorized(
  userProfile: Profile | null,
  targetOutletId: string
): boolean {
  if (!userProfile) return false;
  if (userProfile.role === 'SUPER_ADMIN') return true;
  if (userProfile.role === 'OUTLET_ADMIN') {
    return normalizeOutletId(userProfile.outlet_id) === normalizeOutletId(targetOutletId);
  }
  return false;
}

export const authService = {
  isConfigured(): boolean {
    return isSupabaseConfigured && Boolean(supabase);
  },

  async getSession(): Promise<AuthUserSession | null> {
    // 1. Try Supabase session if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession();

        if (!error && session?.user) {
          const profile = await this.getProfile(session.user.id);
          return {
            user: session.user,
            profile
          };
        }
      } catch (err) {
        console.warn('Supabase session check failed, falling back to local session:', err);
      }
    }

    // 2. Fallback to local stored session
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.user && parsed.profile) {
          return parsed as AuthUserSession;
        }
      }
    } catch {
      // Ignore parse error
    }

    return null;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          return data as Profile;
        }

        // If profile doesn't exist yet in Supabase table, check user metadata
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (user && user.id === userId) {
          const metaRole = (user.user_metadata?.role as Role) || 'OUTLET_ADMIN';
          const metaOutlet = user.user_metadata?.outlet_id || 'sudirman';
          const metaFullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';

          const newProfile: Profile = {
            id: user.id,
            email: user.email || '',
            full_name: metaFullName,
            role: metaRole,
            outlet_id: metaOutlet,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await supabase.from('profiles').upsert(newProfile);
          return newProfile;
        }
      } catch (err) {
        console.warn('Error querying Supabase profile:', err);
      }
    }

    // Check local session profile
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.profile?.id === userId || parsed?.user?.id === userId) {
          return parsed.profile;
        }
      }
    } catch {
      // Ignore
    }

    return null;
  },

  async signIn(email: string, password: string): Promise<{ session: AuthUserSession | null; error: string | null }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check against preset demo accounts first
    const presetAccount = DEFAULT_ADMIN_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === cleanEmail
    );

    const isPresetPasswordValid =
      presetAccount &&
      (cleanPassword === presetAccount.password ||
        cleanPassword === 'admin123' ||
        cleanPassword === 'leton123');

    // 1. If Supabase is configured, try Supabase authentication
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });

        if (!error && data.user) {
          let profile = await this.getProfile(data.user.id);
          if (!profile) {
            profile = {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              full_name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
              role: (data.user.user_metadata?.role as Role) || (presetAccount ? presetAccount.role : 'OUTLET_ADMIN'),
              outlet_id: data.user.user_metadata?.outlet_id || (presetAccount ? presetAccount.outletId : 'sudirman'),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }

          const session: AuthUserSession = {
            user: data.user,
            profile
          };

          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
          notifyAuthListeners(session);
          return { session, error: null };
        }

        // If Supabase returned invalid credentials but it's a valid default demo account, allow local demo sign-in
        if (presetAccount && isPresetPasswordValid) {
          const fallbackSession: AuthUserSession = {
            user: {
              id: `demo-${presetAccount.role.toLowerCase()}-${presetAccount.outletId || 'pusat'}`,
              email: presetAccount.email,
              user_metadata: {
                full_name: presetAccount.name,
                role: presetAccount.role,
                outlet_id: presetAccount.outletId
              }
            },
            profile: {
              id: `demo-${presetAccount.role.toLowerCase()}-${presetAccount.outletId || 'pusat'}`,
              email: presetAccount.email,
              full_name: presetAccount.name,
              role: presetAccount.role,
              outlet_id: presetAccount.outletId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          };

          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(fallbackSession));
          notifyAuthListeners(fallbackSession);
          return { session: fallbackSession, error: null };
        }

        if (error) {
          let indonesianMsg = error.message;
          if (error.message.includes('Invalid login credentials')) {
            indonesianMsg = 'Email atau password yang Anda masukkan salah. Periksa kembali atau gunakan password default "letonadmin".';
          } else if (error.message.includes('Email not confirmed')) {
            indonesianMsg = 'Email belum dikonfirmasi di Supabase Auth.';
          } else if (error.message.includes('rate limit')) {
            indonesianMsg = 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.';
          }
          return { session: null, error: indonesianMsg };
        }
      } catch (err: any) {
        console.warn('Supabase signIn failed, checking local credentials fallback:', err);
      }
    }

    // 2. Offline / Demo Mode Authentication
    if (presetAccount) {
      if (isPresetPasswordValid) {
        const demoSession: AuthUserSession = {
          user: {
            id: `usr-${presetAccount.role.toLowerCase()}-${presetAccount.outletId || 'pusat'}`,
            email: presetAccount.email,
            user_metadata: {
              full_name: presetAccount.name,
              role: presetAccount.role,
              outlet_id: presetAccount.outletId
            }
          },
          profile: {
            id: `usr-${presetAccount.role.toLowerCase()}-${presetAccount.outletId || 'pusat'}`,
            email: presetAccount.email,
            full_name: presetAccount.name,
            role: presetAccount.role,
            outlet_id: presetAccount.outletId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };

        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(demoSession));
        notifyAuthListeners(demoSession);
        return { session: demoSession, error: null };
      } else {
        return {
          session: null,
          error: `Password salah untuk ${presetAccount.email}. Gunakan password default: "letonadmin"`
        };
      }
    }

    return {
      session: null,
      error: 'Akun tidak ditemukan. Gunakan Admin Pusat (admin@letoncoffee.id) atau Admin Outlet (sudirman@letoncoffee.id / kelakap@letoncoffee.id / letgo@letoncoffee.id) dengan password "letonadmin".'
    };
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out of Supabase:', err);
      }
    }
    try {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } catch {
      // Ignore
    }
    notifyAuthListeners(null);
  },

  onAuthStateChange(
    callback: (session: AuthUserSession | null) => void
  ): () => void {
    authListeners.push(callback);

    let supabaseUnsubscribe: (() => void) | undefined;

    if (isSupabaseConfigured && supabase) {
      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await this.getProfile(session.user.id);
          callback({ user: session.user, profile });
        } else {
          // If Supabase signed out, check if we have a local session before reporting null
          const local = await this.getSession();
          callback(local);
        }
      });
      supabaseUnsubscribe = () => subscription.unsubscribe();
    }

    return () => {
      const index = authListeners.indexOf(callback);
      if (index > -1) {
        authListeners.splice(index, 1);
      }
      if (supabaseUnsubscribe) {
        supabaseUnsubscribe();
      }
    };
  },

  async getAllAdmins(): Promise<Profile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as Profile[];
        }
      } catch {
        // Fallback to default presets below
      }
    }

    // Default presets
    return DEFAULT_ADMIN_ACCOUNTS.map((acc, index) => ({
      id: `admin-${acc.outletId || 'pusat'}-${index + 1}`,
      email: acc.email,
      full_name: acc.name,
      role: acc.role,
      outlet_id: acc.outletId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  },

  async updateAdmin(id: string, updates: Partial<Profile>): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        return !error;
      } catch {
        return false;
      }
    }

    // Update in local session if matching current user
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUserSession;
        if (parsed?.profile?.id === id) {
          parsed.profile = { ...parsed.profile, ...updates };
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(parsed));
          notifyAuthListeners(parsed);
        }
      }
    } catch {
      // Ignore
    }

    return true;
  }
};

