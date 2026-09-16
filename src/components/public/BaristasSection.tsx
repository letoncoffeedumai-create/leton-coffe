import React from 'react';
import { Barista } from '../../types';

interface BaristasSectionProps {
  baristas: Barista[];
}

export const BaristasSection: React.FC<BaristasSectionProps> = ({ baristas = [] }) => {
  const list = (baristas || []).filter(Boolean);

  return (
    <section className="w-full py-margin-lg bg-surface" id="baristas-section">
      <div className="max-w-7xl mx-auto px-margin-sm lg:px-margin-lg space-y-space-xl">
        <div className="text-center max-w-xl mx-auto space-y-space-xs">
          <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">
            PEOPLE OF LETON
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
            The Hands Behind Your Cup
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Passionate sensory specialists committed to repeatable precision and warm hospitality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {list.map((barista) => (
            <div
              key={barista.id}
              className="p-space-lg rounded-lg bg-surface-container-lowest shadow-sm flex flex-col items-center text-center space-y-space-md border border-surface-container/70 hover:shadow-md transition-shadow"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container shadow-inner ring-4 ring-surface-container-low">
                <img
                  className="w-full h-full object-cover object-center"
                  alt={barista?.name || 'Barista'}
                  src={barista?.image_url || ''}
                />
              </div>

              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  {barista?.name || 'Barista'}
                </h3>
                <span className="font-label-sm text-label-sm text-primary font-semibold uppercase tracking-wider">
                  {barista?.role || 'Team Leton'}
                </span>
                <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                  {barista?.outlet || ''}
                </p>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                "{barista?.quote || 'Brewing with care.'}"
              </p>

              <div className="pt-space-xs font-label-sm text-label-sm text-on-surface bg-surface-container-low px-space-md py-1 rounded-full">
                Favorite: {barista?.favorite_drink || 'Leton Aren Signature'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
