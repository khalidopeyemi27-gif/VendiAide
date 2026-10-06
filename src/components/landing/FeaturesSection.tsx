import React from 'react';
import { ShieldCheck, Tag, Users, PackageCheck, UserCheck } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Grounded AI Safety Guardrails',
      description:
        'The AI answers ONLY using your verified catalog, delivery fees, and FAQs. If a price or size is unlisted, it explicitly states missing details and offers to connect the customer with you.',
    },
    {
      icon: Tag,
      title: 'Fashion Product & ₦ Naira Native',
      description:
        'Built for clothing sizes (S, M, L, XL, EU 38-45), colors, fabric specs, Lagos delivery rates (₦2,500), interstate rates (₦5,000), and Nigerian bank account transfers.',
    },
    {
      icon: Users,
      title: 'Automated Lead Capture',
      description:
        'Identifies when buyers show high purchase intent. Captures customer name, phone number, product interested in, preferred size, and delivery city.',
    },
    {
      icon: PackageCheck,
      title: 'Structured Order Logging',
      description:
        'Organizes incoming WhatsApp orders into a structured vendor pipeline: Pending Payment, Confirmed, Shipped, and Delivered.',
    },
    {
      icon: UserCheck,
      title: 'One-Click Human Takeover',
      description:
        'Take control of any conversation instantly from your dashboard whenever a customer requests custom designs or direct owner assistance.',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-gray-50/60 border-y border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
            Built For Nigerian Fashion SaaS
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Features Tailored To Turn Enquiries Into Revenue
          </p>
          <p className="mt-4 text-base text-gray-600">
            VendiAide is not a generic chatbot. Every feature is crafted for Nigerian fashion boutiques, RTW brands, sneakers, and accessory vendors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-xs hover:shadow-md transition duration-200"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-6">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feat.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
