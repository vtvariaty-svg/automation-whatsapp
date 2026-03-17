'use client';

interface FiscalEmptyStateProps {
  icon: string;
  title: string;
  description: string;
  cta?: {
    label: string;
    onClick: () => void;
  };
}

export default function FiscalEmptyState({ icon, title, description, cta }: FiscalEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100/60 mb-5">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">{description}</p>
      {cta && (
        <button
          onClick={cta.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
