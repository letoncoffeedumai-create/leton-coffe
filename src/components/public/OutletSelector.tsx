import React from 'react';
import { Outlet } from '../../types';

interface OutletSelectorProps {
  outlets: Outlet[];
  selectedOutletId: string;
  onSelectOutlet: (outletId: string) => void;
  onContinueToMenu?: () => void;
}

export const OutletSelector: React.FC<OutletSelectorProps> = ({
  outlets,
  selectedOutletId,
  onSelectOutlet,
  onContinueToMenu
}) => {
  return (
    <section className="w-full bg-surface-container-lowest py-space-xl" id="outlets-section">
      <div className="max-w-7xl mx-auto px-margin-sm lg:px-margin-lg space-y-space-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">
              ORDERING LOCATION
            </span>
            <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
              Select Your Nearest Leton Outlet
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Choose your pick-up spot or preferred dine-in sanctuary in Dumai.
            </p>
          </div>
          <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
            <span className="material-symbols-outlined text-[20px]">
              storefront
            </span>
            <span>Pick-up ready within 10-15 minutes</span>
          </div>
        </div>

        {/* 3 Outlets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {outlets.map((outlet) => {
            const isOnlineOrderAvailable =
              outlet.id !== 'outlet-letgo' &&
              !outlet.name.toLowerCase().includes('letgo') &&
              !outlet.name.toLowerCase().includes("let'go") &&
              !outlet.name.toLowerCase().includes('mpp');
            const isSelected = isOnlineOrderAvailable && outlet.id === selectedOutletId;

            return (
              <div
                key={outlet.id}
                onClick={() => {
                  if (isOnlineOrderAvailable) {
                    onSelectOutlet(outlet.id);
                    if (onContinueToMenu) onContinueToMenu();
                  }
                }}
                className={`relative p-space-lg rounded-lg transition-all duration-200 border flex flex-col justify-between ${
                  !isOnlineOrderAvailable
                    ? 'bg-surface-container-low/60 border-surface-container opacity-85 cursor-not-allowed'
                    : isSelected
                    ? 'bg-surface-container-low shadow-[0_8px_24px_rgba(14,165,233,0.14)] border-primary-container/40 cursor-pointer'
                    : 'bg-surface-container-lowest shadow-sm hover:shadow-[0_8px_24px_rgba(14,165,233,0.08)] border-surface-container hover:border-primary/30 cursor-pointer group'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold">
                        <span className="material-symbols-outlined text-[14px]">
                          check
                        </span>{' '}
                        ACTIVE SELECTION
                      </span>
                    ) : isOnlineOrderAvailable ? (
                      <span className="inline-flex items-center px-space-sm py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm font-semibold text-on-surface-variant">
                        {outlet.chapter_label || 'OUTLET'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-label-sm text-label-sm font-semibold border border-amber-500/20">
                        <span className="material-symbols-outlined text-[14px]">store</span>
                        WALK-IN ONLY
                      </span>
                    )}
                    <span
                      className={`material-symbols-outlined text-[24px] ${
                        isSelected
                          ? 'text-primary'
                          : 'text-on-surface-variant group-hover:text-primary transition-colors'
                      }`}
                    >
                      {outlet.id.includes('ratusima')
                        ? 'yard'
                        : outlet.id.includes('letgo')
                        ? 'bolt'
                        : 'coffee'}
                    </span>
                  </div>

                  <div className="mt-space-md space-y-space-xs">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {outlet.name}
                    </h3>
                    <p className="font-label-md text-label-md text-primary font-semibold">
                      {outlet.subtitle}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      {outlet.address}. {outlet.description}
                    </p>
                  </div>
                </div>

                <div className="mt-space-md">
                  {!isOnlineOrderAvailable ? (
                    <div className="p-2 rounded-md bg-surface-container text-xs text-on-surface-variant flex items-center justify-between">
                      <span className="font-medium">Tidak melayani order online</span>
                      <span className="text-[11px] font-bold text-amber-600">Walk-in / Kiosk</span>
                    </div>
                  ) : (
                    <div
                      className={`pt-space-sm rounded-md p-space-sm flex items-center justify-between text-on-surface ${
                        isSelected
                          ? 'bg-surface-container-lowest/60'
                          : 'bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-space-xs font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-[16px] text-primary-container">
                          schedule
                        </span>
                        <span>Open {outlet.opening_hours}</span>
                      </div>
                      <span className="font-label-sm text-label-sm font-bold text-primary flex items-center gap-0.5">
                        Order Online <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
