import React from 'react';
import { Clock, HelpCircle, FileX } from 'lucide-react';

export function ProblemSection() {
  const problems = [
    {
      icon: Clock,
      title: 'Lost Leads From Slow Replies',
      description:
        'Customers message 5 different Instagram/WhatsApp vendors at once. When you take hours to reply because you are busy with orders, buyers move to the next vendor.',
    },
    {
      icon: HelpCircle,
      title: 'Endless Repetitive Questions',
      description:
        '“How much is this?”, “Is size L available?”, “What is Lagos shipping fee?”. Answering the exact same 10 questions 50 times a day exhausts your time and energy.',
    },
    {
      icon: FileX,
      title: 'Unorganized Order Tracking',
      description:
        'Managing customer names, sizes, payment screenshots, and delivery locations across scattered WhatsApp chats leads to mix-ups, delayed shipments, and frustrated buyers.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gray-50/60 border-y border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
            The Daily Vendor Struggle
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Selling Fashion on WhatsApp is Great — Until DMs Overwhelm You
          </p>
          <p className="mt-4 text-base text-gray-600">
            Nigerian fashion vendors spend over 4 hours every day manually typing prices, checking stock, and copying payment details. VendiAide fixes this.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((prob, i) => {
            const Icon = prob.icon;
            return (
              <div
                key={i}
                className="rounded-2xl bg-white p-8 border border-gray-200/80 shadow-xs hover:shadow-md transition duration-200"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 mb-6">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{prob.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{prob.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
