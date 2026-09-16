import React from 'react';
import { WebsiteContent } from '../../types';
import { INITIAL_WEBSITE_CONTENT } from '../../data/initialData';

interface AboutAndContactSectionProps {
  contact?: WebsiteContent['contact'];
  contactContent?: WebsiteContent['contact'];
  aboutContent?: any;
}

export const AboutAndContactSection: React.FC<AboutAndContactSectionProps> = ({
  contact: contactProp,
  contactContent
}) => {
  const contact = contactProp || contactContent || INITIAL_WEBSITE_CONTENT.contact;
  const whatsappNumber = contact?.whatsapp || '+62 812-3456-7890';
  const whatsappClean = whatsappNumber.replace(/[^0-9]/g, '');
  const instagramHandle = contact?.instagram || '@letoncoffee';
  const instagramClean = instagramHandle.replace('@', '');
  return (
    <>
      {/* ABOUT SECTION */}
      <section className="w-full py-margin-lg bg-surface-container-lowest" id="about-section">
        <div className="max-w-7xl mx-auto px-margin-sm lg:px-margin-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
            <div className="lg:col-span-6 space-y-space-md">
              <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">
                OUR PHILOSOPHY
              </span>
              <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                Bridging your desire of coffee.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Leton Coffee began with a simple conviction: great coffee is an everyday sanctuary,
                not an elitist ritual. We source 100% Grade 1 Arabica micro-lots from across
                the Indonesian archipelago and roast in dedicated micro-batches in Dumai.
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Every extraction uses double reverse-osmosis mineral-balanced water calibrated
                specifically to preserve delicate florals, sweet cane sugar finish, and zero
                harsh bitterness.
              </p>

              <div className="grid grid-cols-2 gap-space-md pt-space-xs">
                <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-container">
                  <span className="font-headline-md text-headline-md font-bold text-primary">
                    100%
                  </span>
                  <p className="font-label-md text-on-surface font-semibold mt-1">
                    Specialty Grade Beans
                  </p>
                  <p className="font-body-sm text-on-surface-variant text-[12px]">
                    Directly sourced from trusted Indonesian origin farmers.
                  </p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-container">
                  <span className="font-headline-md text-headline-md font-bold text-primary">
                    93.2°C
                  </span>
                  <p className="font-label-md text-on-surface font-semibold mt-1">
                    Precision Extraction
                  </p>
                  <p className="font-body-sm text-on-surface-variant text-[12px]">
                    Temperature-stabilized multi-boiler espresso flow.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-xl overflow-hidden shadow-lg bg-surface-container">
                <img
                  className="w-full h-96 object-cover object-center"
                  alt="Leton Coffee Philosophy & Daylight"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYrlzz-0y1L76qlDkK0iu7K7Qy_Bx2i0FpyDJZgD9besgJZ4_OsnnQpqW-dT3rimzJ4nwE-e_2-ncvvcOpY2oKLpNAqVjV2Bqcob7Z3AN45mletvH3ogBYr021h5vU2zC6QssGF8isMtaxpjEDB0xBFnrZbU75AykbRh8zp0L2RiuFMABIIOGRYMogCkrw2vmcP38_HyyizVncU8red4RuQDm42NLUaFJfQaMLCKC7NNKSJnlYRS03nw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/50 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="font-headline-sm font-bold">Dumai's Daylight Coffee Sanctuaries</p>
                  <p className="font-body-sm text-surface-container-high">
                    Sudirman Sanctuary • Kelakap 7 Slow Bar • LET'GO Kiosk
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT STRIP SECTION */}
      <section className="w-full bg-surface-container-lowest py-space-xl shadow-xs" id="contact-section">
        <div className="max-w-7xl mx-auto px-margin-sm lg:px-margin-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-space-lg bg-surface-container-low p-space-lg lg:p-space-xl rounded-xl border border-surface-container">
            <div className="space-y-space-xs text-center lg:text-left">
              <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-widest">
                GET IN TOUCH
              </span>
              <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                Have a Question or Custom Bulk Order?
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Reach out directly to our team via WhatsApp for instant assistance, feedback, or
                private event inquiries.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-space-sm">
              <a
                className="inline-flex items-center gap-space-xs px-space-lg py-3 rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-bold hover:bg-primary transition-colors shadow-sm cursor-pointer"
                href={`https://wa.me/${whatsappClean}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chat
                </span>
                <span>WhatsApp: {whatsappNumber}</span>
              </a>
              <a
                className="inline-flex items-center gap-space-xs px-space-lg py-3 rounded-full bg-surface-container-lowest text-primary font-label-md text-label-md font-bold hover:bg-surface-container transition-colors shadow-sm cursor-pointer border border-surface-container"
                href={`https://instagram.com/${instagramClean}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  photo_camera
                </span>
                <span>Follow {instagramHandle}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
