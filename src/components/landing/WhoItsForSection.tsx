import React from 'react';
import { Shirt, Footprints, Briefcase, Sparkles, Store, Scissors } from 'lucide-react';

export function WhoItsForSection() {
  const verticals = [
    {
      icon: Shirt,
      title: 'Ready-To-Wear Brands',
      description: 'Hoodies, two-piece sets, dresses, shirts, cargo pants, and urban streetwear.',
    },
    {
      icon: Sparkles,
      title: 'Abaya & Hijab Boutiques',
      description: 'Luxury velvet abayas, silk hijabs, inner caps, and modest fashion sets.',
    },
    {
      icon: Footprints,
      title: 'Sneakers & Footwear Vendors',
      description: 'Sneakers, slides, heels, sandals, and catalog-matched footwear sizing.',
    },
    {
      icon: Briefcase,
      title: 'Bags & Accessories Vendors',
      description: 'Handbags, totes, sunglasses, jewelry, belts, and luxury wristwatches.',
    },
    {
      icon: Store,
      title: 'Thrift & Online Fashion Boutiques',
      description: 'First-grade vintage apparel, thrift outfits, and small online Instagram shops.',
    },
    {
      icon: Scissors,
      title: 'Traditional Wear & Asoebi Brands',
      description: 'Agbada, senatorial native sets, bespoke asoebi styles, and tailor-guided fabric consultations.',
    },
  ];

  return (
    <section id="who-its-for" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
            Target Audience
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Designed Specifically For Nigerian Fashion Businesses
          </p>
          <p className="mt-4 text-base text-gray-600">
            Whether you run a boutique store in Ikeja or sell directly through Instagram DMs, VendiAide handles your fashion inquiries seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {verticals.map((vert, i) => {
            const Icon = vert.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-gray-200/80 bg-gray-50/40 p-6 hover:bg-white hover:shadow-md hover:border-emerald-300 transition duration-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{vert.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{vert.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
