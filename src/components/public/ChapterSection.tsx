import React from 'react';
import { Outlet, WebsiteContent } from '../../types';
import { INITIAL_WEBSITE_CONTENT } from '../../data/initialData';

interface ChapterSectionProps {
  content?: WebsiteContent['chapters'];
  outlets?: Outlet[];
  onSelectChapter?: (outletId: string) => void;
}

export const ChapterSection: React.FC<ChapterSectionProps> = ({
  content,
  outlets = [],
  onSelectChapter
}) => {
  const sudirman = content?.sudirman || INITIAL_WEBSITE_CONTENT.chapters.sudirman;
  const ratusima = content?.ratusima || INITIAL_WEBSITE_CONTENT.chapters.ratusima;

  return (
    <section className="w-full py-margin-lg bg-surface-container-lowest" id="chapters-section">
      <div className="max-w-7xl mx-auto px-margin-sm lg:px-margin-lg space-y-space-xl">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto space-y-space-xs">
          <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">
            ARCHITECTURE & ROASTING
          </span>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
            Chapters of Leton
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Every Leton outlet is curated as an individual narrative chapter designed for
            reflection, conversation, and fast-paced city flow.
          </p>
        </div>

        {/* Story Mosaic */}
        <div className="space-y-space-xl">
          {/* Story Row 1: Sudirman */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
            <div className="lg:col-span-6 rounded-lg overflow-hidden bg-surface-container-low shadow-sm">
              <img
                className="w-full h-80 lg:h-96 object-cover object-center transform hover:scale-102 transition-transform duration-500"
                alt="Leton Chapter 05 Sudirman Flagship"
                src={sudirman.image_url}
              />
            </div>
            <div className="lg:col-span-6 space-y-space-md lg:pl-space-md">
              <span className="font-headline-lg text-headline-lg text-secondary-container font-black tracking-tight">
                {sudirman.chapter_num || '05 / SUDIRMAN'}
              </span>
              <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {sudirman.title || 'The Flagship Roastery Sanctuary'}
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                {sudirman.description ||
                  "Situated in the beating heart of Dumai's civic center, Chapter 05 Sudirman is engineered with high-volume daylight, acoustic serenity, and transparent roasting."}
              </p>
              <div className="flex items-center gap-space-lg text-on-surface pt-space-xs">
                <div>
                  <span className="font-headline-sm text-headline-sm font-bold text-primary">
                    {sudirman.seating || 64}
                  </span>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Indoor Seating
                  </p>
                </div>
                <div>
                  <span className="font-headline-sm text-headline-sm font-bold text-primary">
                    {sudirman.daylight || '100%'}
                  </span>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Solar Daylighted
                  </p>
                </div>
                <div>
                  <span className="font-headline-sm text-headline-sm font-bold text-primary">
                    {sudirman.wifi || 'Wi-Fi 6'}
                  </span>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    High Speed Desk Hub
                  </p>
                </div>
              </div>

              {onSelectChapter && (
                <div className="pt-space-xs">
                  <button
                    type="button"
                    onClick={() => onSelectChapter('outlet-sudirman')}
                    className="inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Pesan di Chapter 05 Sudirman</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Story Row 2: Kelakap 7 (Reversed) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
            <div className="lg:col-span-6 order-2 lg:order-1 space-y-space-md lg:pr-space-md">
              <span className="font-headline-lg text-headline-lg text-secondary-container font-black tracking-tight">
                {ratusima.chapter_num || '06 / RATUSIMA'}
              </span>
              <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {ratusima.title || 'Kelakap 7 — Greenery & Slow Bar'}
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                {ratusima.description ||
                  'Designed as an urban retreat from the coastal midday heat. Shaded by wide ficus canopies and bordered with fragrant herbs, this chapter celebrates the unhurried craft of ceramic drippers, aeropress clarity, and relaxed evening dialogue.'}
              </p>
              <div className="flex items-center gap-space-md pt-space-xs">
                {(ratusima.features || ['Open Air Veranda', 'Vinyl Listening Nook']).map(
                  (feature, i) => (
                    <span
                      key={i}
                      className="px-space-md py-1 rounded-full bg-surface-container-high font-label-md text-label-md text-primary font-semibold"
                    >
                      {feature}
                    </span>
                  )
                )}
              </div>

              {onSelectChapter && (
                <div className="pt-space-xs">
                  <button
                    type="button"
                    onClick={() => onSelectChapter('outlet-kelakap')}
                    className="inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Pesan di Chapter 06 Kelakap 7</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 rounded-lg overflow-hidden bg-surface-container-low shadow-sm">
              <img
                className="w-full h-80 lg:h-96 object-cover object-center transform hover:scale-102 transition-transform duration-500"
                alt="Leton Chapter 06 Ratusima Kelakap 7"
                src={ratusima.image_url}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
