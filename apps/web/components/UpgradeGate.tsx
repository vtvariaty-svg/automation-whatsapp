'use client';

import Link from 'next/link';

interface UpgradeGateProps {
  icon: string;
  title: string;
  message: string;
  ctaPlan: string;
}

/** Full-page upgrade gate shown when a user lacks access to a feature. */
export default function UpgradeGate({ icon, title, message, ctaPlan }: UpgradeGateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center p-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100/50">
          <span className="text-4xl">{icon}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">{message}</p>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          Fazer upgrade para {ctaPlan} →
        </Link>
      </div>
    </div>
  );
}
