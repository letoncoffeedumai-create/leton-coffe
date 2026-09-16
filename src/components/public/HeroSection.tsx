import React from 'react';
import { WebsiteContent } from '../../types';
import { INITIAL_WEBSITE_CONTENT } from '../../data/initialData';

interface HeroSectionProps {
  content?: WebsiteContent['hero'];
  onOrderOnline?: () => void;
  onExploreMenu?: () => void;
  onSelectFeatured?: () => void;
  onOrderNow?: () => void;
  onExploreChapters?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  content: contentProp,
  onOrderOnline,
  onExploreMenu,
  onSelectFeatured,
  onOrderNow,
  onExploreChapters
}) => {
  const content = contentProp || INITIAL_WEBSITE_CONTENT.hero;
  const handleOrder = onOrderOnline || onOrderNow;
  const handleExplore = onExploreMenu || onExploreChapters;
  const handleSelectFeatured = onSelectFeatured || handleOrder;

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#f0faff] via-surface to-surface-container-lowest" id="hero-section">
      {/* Decorative Radiance Rings */}
      <div className="absolute -top-32 left-1/4 w-[540px] h-[540px] rounded-full bg-secondary-container/15 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-primary-container/10 blur-3xl pointer-events-none"></div>

      <section className="relative max-w-7xl mx-auto px-margin-sm lg:px-margin-lg pt-space-lg pb-space-xl lg:pt-space-xl lg:pb-margin-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
          {/* Left Hero Narrative */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-space-md lg:space-y-space-lg">
            {/* Tag Pill */}
            <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-high shadow-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
              <span className="font-label-md text-label-md text-primary tracking-wider uppercase font-semibold">
                {content.tagline || 'FRESH ROASTS DAILY • SPECIALTY COFFEE'}
              </span>
            </div>

            {/* Headline Hierarchy */}
            <div className="space-y-space-xs">
              <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold">
                {content.title || 'LETON COFFEE'}
              </h1>
              <p className="font-headline-lg text-headline-lg text-primary font-semibold tracking-tight">
                {content.subtitle || 'Bridging your desire of coffee.'}
              </p>
            </div>

            {/* Description */}
            <p className="font-body-xl text-body-xl text-on-surface-variant max-w-xl leading-relaxed">
              {content.description ||
                "Crafting modern coffee moments with high-clarity extraction, unhurried morning daylight, and bespoke single origins across Dumai's signature spaces."}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
              <button
                onClick={handleOrder}
                className="inline-flex items-center justify-center gap-space-sm px-space-xl py-3.5 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg tracking-wide uppercase shadow-[0_12px_28px_-4px_rgba(14,165,233,0.38)] hover:bg-primary hover:shadow-[0_16px_32px_-4px_rgba(14,165,233,0.48)] transition-all duration-300 transform active:scale-95 cursor-pointer"
                type="button"
              >
                <span>ORDER ONLINE</span>
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </button>
              <button
                onClick={handleExplore}
                className="inline-flex items-center justify-center gap-space-xs px-space-xl py-3.5 rounded-full bg-surface-container-lowest text-primary font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-all duration-200 cursor-pointer border border-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  near_me
                </span>
                <span>Explore Outlets & Menu</span>
              </button>
            </div>

            {/* Trust Metrics Strip */}
            <div className="grid grid-cols-3 gap-space-md pt-space-md w-full max-w-lg">
              <div className="flex flex-col">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  3 Outlets
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Across Dumai City
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-0.5 text-primary">
                  <span className="font-headline-md text-headline-md font-bold">
                    4.9
                  </span>
                  <span
                    className="material-symbols-outlined text-[20px] text-amber-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  4,200+ Reviews
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  100%
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Grade 1 Arabica
                </span>
              </div>
            </div>
          </div>

          {/* Right Hero Glass Canvas with Image */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-lowest shadow-[0_20px_50px_-10px_rgba(14,165,233,0.18)]">
              <img
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 ease-out"
                alt="Leton Specialty Coffee Craft"
                src={
                  content.featured_image ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuA8BAU8LqRzResUVqdUGMKpusAgl1pxQPc7BEVDSiQpHUmVAtquKXORgsgQ32U2YIF10AwdT_iSjl-lLM0uixm52N1ge_Ty5zF9XvEevNzPVxjeH758vyPndX9Ua4QjxT5RFYWxNIW7y27bYK2yuT6rEQ1zPZIj-Uhb7TB4SpHyW1Og-7sfdltNn-n9J_pBqh_AAtz9je7pJR-cCNLoMCwPBA4gTuAanlk0fsB7sRbgXNa2gNj0V_7HmA'
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent pointer-events-none"></div>

              {/* Top Floating Origin Tag */}
              <div className="absolute top-space-md left-space-md bg-surface-container-lowest/90 backdrop-blur-md px-space-md py-1 rounded-full shadow-sm">
                <span className="font-label-sm text-label-sm text-primary tracking-wider uppercase font-bold">
                  Cold Crafted • House Blend
                </span>
              </div>

              {/* Floating Pill 1: Special Item Card */}
              <div className="absolute bottom-space-lg left-space-md right-space-md bg-surface-container-lowest/95 backdrop-blur-xl p-space-md rounded-lg shadow-[0_12px_32px_rgba(14,165,233,0.15)] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-label-sm text-label-sm text-primary font-bold tracking-widest uppercase">
                    TODAY'S SPECIAL
                  </span>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    {content.featured_item_name || 'Sea Salt Cloud Latte'}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {content.featured_item_desc ||
                      'Double ristretto, vanilla bean cold cream'}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    Rp {Number(content.featured_item_price || 28000).toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={onSelectFeatured}
                    className="mt-1 w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:bg-primary transition-all active:scale-90 shadow-sm cursor-pointer"
                    type="button"
                    title="Pesan Sekarang"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      add
                    </span>
                  </button>
                </div>
              </div>

              {/* Floating Pill 2: Fresh Brew Badge */}
              <div className="absolute top-space-xl right-space-md bg-surface-container-lowest/90 backdrop-blur-md px-space-md py-1.5 rounded-full shadow-md flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  timer
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Brewed in 4 mins
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
