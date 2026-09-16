import React, { useState } from 'react';
import { Outlet } from '../../types';

interface NavbarProps {
  currentView?: string;
  activePage?: string;
  onNavigate: (view: string) => void;
  cartCount?: number;
  cartItemCount?: number;
  onOpenCart: () => void;
  currentOutlet?: Outlet;
  selectedOutlet?: Outlet;
  outlets?: Outlet[];
  onSelectOutlet?: (outletId: string) => void;
  onOpenOutletSelector?: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activePage,
  onNavigate,
  cartCount,
  cartItemCount,
  onOpenCart,
  currentOutlet,
  selectedOutlet,
  outlets,
  onSelectOutlet,
  onOpenOutletSelector,
  onOpenAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const effectiveView = currentView || activePage || 'home';
  const effectiveCartCount = cartCount ?? cartItemCount ?? 0;
  const activeOutlet = currentOutlet || selectedOutlet;

  const handleOpenOutletModal = () => {
    if (onOpenOutletSelector) {
      onOpenOutletSelector();
    } else if (onSelectOutlet && outlets && outlets.length > 0) {
      const nextIdx = (outlets.findIndex(o => o.id === activeOutlet?.id) + 1) % outlets.length;
      onSelectOutlet(outlets[nextIdx].id);
    }
  };

  const handleAdminClick = () => {
    if (onOpenAdmin) {
      onOpenAdmin();
    } else {
      onNavigate('admin');
    }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'locations', label: 'Locations' },
    { id: 'chapters', label: 'Chapters' },
    { id: 'baristas', label: 'Baristas' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const outletShortName = activeOutlet?.name
    ? activeOutlet.name.replace('Leton Coffee — ', '').replace("LET'GO — ", "LET'GO ")
    : 'Sudirman';

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container shadow-[0_4px_20px_-2px_rgba(14,165,233,0.06)]">
      <div className="h-20 max-w-7xl mx-auto px-margin-sm lg:px-margin-lg flex items-center justify-between gap-gutter">
        {/* Brand Logo & Title */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-space-md text-left cursor-pointer group"
        >
          <img
            alt="Leton Coffee Wordmark Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            src="https://lh3.googleusercontent.com/aida/AEtjO1XEAFcSsdi4lPaFr0KOTCcwzo-7rkVIMtTaqD8iEj7s1orwYkQ1o4NusxU6gpIpV562H6etyQ1RwuTGKu53A6lbMAvUxWVo2TpHY0aIYO5g66Rts4wwaLX25lQ9mFWoAJMh76md4rU1egcMp10BlR0EgYlCQlUezoT11L6gqOhJMdZWZO1GyOSYmD1GHNPtee5LUcO8rlUJgnfYmlsnebbCctAqoblrdlfMovzQffNuFCNoJR0oNkIBRBpo"
          />
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold hidden sm:inline-block">
            Leton Coffee
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-space-xs bg-surface-container-lowest p-1 rounded-full border border-surface-container/60 shadow-xs">
          {navItems.map((item) => {
            const isActive = effectiveView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-space-md py-1.5 rounded-full text-label-md transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface-container text-primary font-semibold shadow-[0_2px_8px_rgba(14,165,233,0.12)]'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Group */}
        <div className="flex items-center gap-space-sm sm:gap-space-md">
          {/* Outlet Quick Selector Pill */}
          <button
            onClick={handleOpenOutletModal}
            className="hidden md:flex items-center gap-space-xs px-space-md py-2 rounded-full bg-surface-container-low text-primary font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
            type="button"
            title="Ganti Outlet"
          >
            <span className="material-symbols-outlined text-[18px] text-primary-container">
              location_on
            </span>
            <span>Outlet: {outletShortName}</span>
          </button>

          {/* Primary CTA: ORDER ONLINE */}
          <button
            onClick={() => handleNavClick('menu')}
            className="flex items-center justify-center px-space-lg py-2 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg tracking-wide uppercase shadow-[0_8px_24px_-2px_rgba(14,165,233,0.35)] hover:bg-primary transition-all active:scale-95 cursor-pointer"
            type="button"
          >
            ORDER ONLINE
          </button>

          {/* Shopping Bag Button with Badge */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low text-primary hover:bg-surface-container transition-colors cursor-pointer"
            type="button"
            aria-label="Keranjang Belanja"
          >
            <span className="material-symbols-outlined text-[20px]">
              shopping_bag
            </span>
            {effectiveCartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold ring-2 ring-surface-container-lowest animate-scale">
                {effectiveCartCount}
              </span>
            )}
          </button>

          {/* Admin CMS Access Icon */}
          <button
            onClick={handleAdminClick}
            className="w-8 h-8 rounded-full bg-primary hover:bg-on-primary-container text-on-primary flex items-center justify-center transition-all cursor-pointer shadow-xs"
            type="button"
            title="Admin CMS & Orders"
          >
            <span className="material-symbols-outlined text-[18px]">
              person
            </span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container"
            type="button"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-surface-container-lowest border-b border-surface-container px-margin-sm py-4 space-y-2 shadow-lg animate-fadeIn">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-label-lg transition-colors ${
                effectiveView === item.id
                  ? 'bg-surface-container text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-surface-container flex items-center justify-between">
            <button
              onClick={() => {
                handleOpenOutletModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-primary font-label-sm py-1"
            >
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span>Outlet: {outletShortName} (Ganti)</span>
            </button>
            <button
              onClick={() => {
                handleAdminClick();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1 text-on-surface-variant font-label-sm py-1"
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span>Admin CMS</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
