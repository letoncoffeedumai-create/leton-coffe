import React from 'react';
import { Outlet } from '../../types';

interface FooterProps {
  onNavigate?: (view: string) => void;
  onOpenAdmin?: () => void;
  outlets?: Outlet[];
  onOrderClick?: () => void;
  onAdminClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenAdmin,
  outlets,
  onOrderClick,
  onAdminClick
}) => {
  const handleNav = (view: string) => {
    if (view === 'menu' && onOrderClick) {
      onOrderClick();
    } else if (onNavigate) {
      onNavigate(view);
    }
  };

  const handleAdmin = () => {
    if (onAdminClick) onAdminClick();
    else if (onOpenAdmin) onOpenAdmin();
    else if (onNavigate) onNavigate('admin');
  };
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-surface-container mt-auto">
      <div className="max-w-7xl mx-auto px-margin-sm lg:px-margin-lg py-margin-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter-lg pb-space-xl">
          {/* Brand Presentation */}
          <div className="space-y-space-md">
            <div className="flex items-center gap-space-sm">
              <img
                alt="Leton Coffee Wordmark Logo"
                className="h-7 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1XEAFcSsdi4lPaFr0KOTCcwzo-7rkVIMtTaqD8iEj7s1orwYkQ1o4NusxU6gpIpV562H6etyQ1RwuTGKu53A6lbMAvUxWVo2TpHY0aIYO5g66Rts4wwaLX25lQ9mFWoAJMh76md4rU1egcMp10BlR0EgYlCQlUezoT11L6gqOhJMdZWZO1GyOSYmD1GHNPtee5LUcO8rlUJgnfYmlsnebbCctAqoblrdlfMovzQffNuFCNoJR0oNkIBRBpo"
              />
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Leton Coffee
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              Bridging your desire of coffee through high-clarity craft and unhurried daylight.
            </p>
            <div className="pt-space-xs">
              <div className="flex items-center gap-space-xs font-label-md text-label-md text-primary">
                <span className="material-symbols-outlined text-[18px]">
                  schedule
                </span>
                <span>Everyday 07:00 – 23:00 WIB</span>
              </div>
            </div>
          </div>

          {/* Outlets Information */}
          <div className="space-y-space-sm">
            <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Our Outlets
            </h4>
            <ul className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <p className="font-label-md text-label-md text-on-surface font-semibold">
                  1. Sudirman Sanctuary
                </p>
                <p>Jl. Jend. Sudirman No. 42, Central Hub</p>
              </li>
              <li>
                <p className="font-label-md text-label-md text-on-surface font-semibold">
                  2. Ratusima / Kelakap 7
                </p>
                <p>Jl. Kelakap Tujuh No. 15, Ratusima</p>
              </li>
              <li>
                <p className="font-label-md text-label-md text-on-surface font-semibold">
                  3. LET'GO Depan MPP
                </p>
                <p>Kawasan Pelayanan Publik, Depan MPP</p>
              </li>
            </ul>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-space-sm">
            <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Quick Navigation
            </h4>
            <ul className="space-y-space-xs font-body-md text-body-md">
              <li
                onClick={() => handleNav('menu')}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Beverages & Pour-Over
              </li>
              <li
                onClick={() => handleNav('menu')}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Single Origin Beans
              </li>
              <li
                onClick={() => handleNav('menu')}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Pastry & Warm Bites
              </li>
              <li
                onClick={() => handleNav('chapters')}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Chapters of Leton
              </li>
              <li
                onClick={() => handleNav('locations')}
                className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Store Locator
              </li>
              <li
                onClick={handleAdmin}
                className="text-primary hover:underline transition-colors cursor-pointer font-medium pt-1"
              >
                Admin Portal & Orders
              </li>
            </ul>
          </div>

          {/* Connect with Us */}
          <div className="space-y-space-sm">
            <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Connect with Us
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Order queries, collaborations, or private tasting inquiries:
            </p>
            <div className="space-y-space-xs font-label-md text-label-md">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-space-xs text-on-surface hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  chat
                </span>
                <span>WhatsApp: +62 812-3456-7890</span>
              </a>
              <a
                href="https://instagram.com/letoncoffee"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-space-xs text-on-surface hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  photo_camera
                </span>
                <span>Instagram: @letoncoffee</span>
              </a>
            </div>
            <div className="pt-space-sm">
              <span className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-low text-primary font-label-sm text-label-sm">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                Coffee Bar Live
              </span>
            </div>
          </div>
        </div>

        {/* Bottom legal and copyright */}
        <div className="pt-space-lg border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm text-on-surface-variant">
          <p>© 2025–2026 Leton Coffee Roastery & Bar. All rights reserved.</p>
          <div className="flex gap-space-md">
            <span className="hover:text-primary cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span className="hover:text-primary cursor-pointer transition-colors">
              Terms of Service
            </span>
            <span className="hover:text-primary cursor-pointer transition-colors">
              Quality Assurance
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
