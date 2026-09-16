import React, { useEffect, useState } from 'react';
import { Profile, Role } from '../../types';
import { authService } from '../../services/authService';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AdminUsersViewProps {
  currentProfile: Profile | null;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ currentProfile }) => {
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editAdmin, setEditAdmin] = useState<Profile | null>(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await authService.getAllAdmins();
      if (data && data.length > 0) {
        setAdmins(data);
      } else {
        // Fallback display if table is empty
        setAdmins([
          {
            id: currentProfile?.id || 'admin-1',
            email: currentProfile?.email || 'admin@letoncoffee.id',
            full_name: currentProfile?.full_name || 'Admin Pusat Leton',
            role: 'SUPER_ADMIN',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'admin-sdr',
            email: 'sudirman@letoncoffee.id',
            full_name: 'Lead Barista Sudirman',
            role: 'OUTLET_ADMIN',
            outlet_id: 'sudirman',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'admin-rtm',
            email: 'kelakap@letoncoffee.id',
            full_name: 'Store Supervisor Kelakap 7',
            role: 'OUTLET_ADMIN',
            outlet_id: 'kelakap',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSaveRole = async (adminId: string, role: Role, outletId?: string) => {
    await authService.updateAdmin(adminId, { role, outlet_id: outletId });
    setAdmins(
      admins.map((a) => (a.id === adminId ? { ...a, role, outlet_id: outletId } : a))
    );
    setEditAdmin(null);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
            Manajemen Akun Admin & Hak Akses (RBAC)
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Daftar pengguna dengan hak akses SUPER_ADMIN dan OUTLET_ADMIN yang diamankan oleh Supabase Auth & RLS.
          </p>
        </div>

        <button
          onClick={fetchAdmins}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-full bg-surface-container-low text-primary text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">sync</span>
          <span>Refresh Data</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container">
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Penugasan Outlet</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-xs">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-surface-container-low/50">
                  <td className="py-3 px-4 font-bold text-on-surface">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {adm.full_name?.charAt(0) || 'A'}
                      </div>
                      <span>{adm.full_name || 'Admin'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-on-surface-variant">{adm.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        adm.role === 'SUPER_ADMIN'
                          ? 'bg-primary text-on-primary'
                          : 'bg-primary-container/20 text-primary'
                      }`}
                    >
                      {adm.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {adm.role === 'SUPER_ADMIN' ? (
                      <span className="text-outline font-semibold">Semua Outlet (Pusat)</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container text-on-surface">
                        {adm.outlet_id?.toUpperCase() || 'BELUM DITENTUKAN'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setEditAdmin(adm)}
                      className="px-3 py-1 rounded-full text-xs font-bold text-primary hover:bg-surface-container cursor-pointer"
                    >
                      Ubah Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <h4 className="font-title-lg font-bold text-on-surface">
              Ubah Role & Penugasan
            </h4>
            <p className="text-xs text-on-surface-variant">
              Pengguna: <span className="font-bold text-on-surface">{editAdmin.email}</span>
            </p>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Peran (Role)</label>
              <select
                defaultValue={editAdmin.role}
                id="edit-role-select"
                className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh Seluruh Sistem)</option>
                <option value="OUTLET_ADMIN">OUTLET_ADMIN (Terbatas 1 Outlet Saja)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Cabang Outlet (Untuk Outlet Admin)
              </label>
              <select
                defaultValue={editAdmin.outlet_id || 'sudirman'}
                id="edit-outlet-select"
                className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface"
              >
                <option value="sudirman">Sudirman (Chapter I)</option>
                <option value="kelakap">Kelakap Tujuh / Ratusima (Chapter II)</option>
                <option value="letgo">LET'GO MPP (Chapter III)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-surface-container flex justify-end gap-2">
              <button
                onClick={() => setEditAdmin(null)}
                className="px-4 py-2 rounded-full bg-surface-container text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const roleEl = document.getElementById('edit-role-select') as HTMLSelectElement;
                  const outletEl = document.getElementById('edit-outlet-select') as HTMLSelectElement;
                  handleSaveRole(
                    editAdmin.id,
                    roleEl.value as Role,
                    roleEl.value === 'OUTLET_ADMIN' ? outletEl.value : undefined
                  );
                }}
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
