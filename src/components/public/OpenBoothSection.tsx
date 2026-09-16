import React from 'react';
import { WebsiteContent } from '../../types';
import { INITIAL_WEBSITE_CONTENT } from '../../data/initialData';

interface OpenBoothSectionProps {
  content?: WebsiteContent['open_booth'];
}

export const OpenBoothSection: React.FC<OpenBoothSectionProps> = ({ content: contentProp }) => {
  const content = contentProp || INITIAL_WEBSITE_CONTENT.open_booth;

  return (
    <section className="w-full py-margin-lg bg-surface-container-low" id="open-booth-section">
      <div className="max-w-7xl mx-auto px-margin-sm lg:px-margin-lg">
        <div className="bg-surface-container-lowest rounded-xl p-space-xl lg:p-margin-lg shadow-[0_12px_40px_rgba(14,165,233,0.1)] grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center border border-surface-container">
          <div className="lg:col-span-7 space-y-space-md">
            <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">
              {content.tag || 'CATERING & CELEBRATIONS'}
            </span>
            <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
              {content.title || 'Leton Open Booth Mobile Bar'}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              {content.description ||
                'Elevate your wedding, corporate milestone, or private gathering with our minimalist mobile coffee cart. Featuring professional dual-boiler commercial machines, trained baristas, and customizable cup sleeve branding.'}
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm font-body-md text-body-md text-on-surface pt-space-xs">
              {(
                content.bullets || [
                  'Full Signature Drink Menu',
                  'Fast 150+ Cups/Hour Flow',
                  'Bespoke Cup Branding',
                  'Turnkey Electricity & Water'
                ]
              ).map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary-container text-[18px]">
                    verified
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="pt-space-md">
              <a
                className="inline-flex items-center gap-space-sm px-space-xl py-3.5 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg tracking-wide uppercase font-bold shadow-[0_8px_24px_rgba(14,165,233,0.32)] hover:bg-primary transition-all active:scale-95"
                href={
                  content.wa_link ||
                  'https://wa.me/6281234567890?text=Halo%20Leton%20Coffee,%20saya%20tertarik%20booking%20Open%20Booth'
                }
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  event
                </span>
                <span>BOOK FOR EVENT</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-lg overflow-hidden shadow-md">
            <img
              className="w-full h-72 lg:h-80 object-cover object-center transform hover:scale-102 transition-transform duration-500"
              alt="Leton Open Booth Mobile Bar"
              src={content.image_url}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
