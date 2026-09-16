import React, { useState } from 'react';
import {
  authService,
  AuthUserSession,
  DEFAULT_ADMIN_ACCOUNTS,
  DefaultAdminAccount
} from '../../services/authService';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AdminLoginProps {
  onLoginSuccess: (session: AuthUserSession) => void;
  onBackToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToHome
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectPreset = (account: DefaultAdminAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Harap isi alamat email dan password.');
      return;
    }

    setIsLoading(true);

    try {
      const { session, error } = await authService.signIn(email, password);

      if (error) {
        setErrorMessage(error);
        setIsLoading(false);
        return;
      }

      if (session) {
        onLoginSuccess(session);
      } else {
        setErrorMessage('Sesi login tidak valid. Silakan coba lagi.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat menghubungi server autentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-b from-[#f0faff] via-surface to-surface-container-low px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-container/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary-container/15 blur-3xl pointer-events-none"></div>

      {/* Top back button */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between z-10">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md cursor-pointer group"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          Kembali ke Website Leton Coffee
        </button>

        {isSupabaseConfigured ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Supabase Auth Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Mode Akun Default / Demo
          </span>
        )}
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-surface-container shadow-xl p-8 sm:p-10 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md mb-4 ring-4 ring-primary-container/20">
            <span className="material-symbols-outlined text-[28px] text-primary-container">
              coffee_maker
            </span>
          </div>

          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
            LETON COFFEE
          </h1>
          <p className="font-label-lg text-label-lg text-primary font-semibold tracking-wide uppercase mt-0.5">
            Admin Dashboard
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 max-w-xs">
            Masuk untuk mengelola operasional pesanan, katalog menu, stok outlet, dan konten website.
          </p>
        </div>

        {/* Quick Demo Credentials Box */}
        <div className="mb-6 p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">key</span>
              Pilih Akun Cepat (Password: <code className="text-primary font-mono font-bold">letonadmin</code>)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_ADMIN_ACCOUNTS.map((acc) => {
              const isSelected = email.toLowerCase() === acc.email.toLowerCase();
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectPreset(acc)}
                  className={`p-2 rounded-lg text-left text-xs transition-all border cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border-surface-container'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate">
                      {acc.role === 'SUPER_ADMIN' ? '👑 Admin Pusat' : `☕ ${acc.name.replace('Lead Barista ', '').replace('Store Supervisor ', '')}`}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] truncate mt-1 ${
                      isSelected ? 'text-primary-container' : 'text-on-surface-variant'
                    }`}
                  >
                    {acc.email}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-shake">
            <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0 mt-0.5">
              error
            </span>
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block font-label-md text-label-md font-bold text-on-surface mb-1.5">
              Email Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@letoncoffee.id"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container-low border border-surface-container font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-outline"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-label-md text-label-md font-bold text-on-surface">
                Password
              </label>
              <button
                type="button"
                onClick={() => setPassword('letonadmin')}
                className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
              >
                Gunakan "letonadmin"
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-surface-container-low border border-surface-container font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-outline"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold hover:bg-primary-container transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></span>
                <span>Memproses Login...</span>
              </>
            ) : (
              <>
                <span>Login ke Dashboard</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-6 pt-5 border-t border-surface-container text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">
              security
            </span>
            <span>Role-Based Access Control: Super Admin & Outlet Admin</span>
          </div>
          <p className="text-[11px] text-outline mt-1">
            Leton Coffee Dumai • Chapter I Sudirman, Chapter II Kelakap 7, Chapter III LET'GO MPP
          </p>
        </div>
      </div>
    </div>
  );
};
