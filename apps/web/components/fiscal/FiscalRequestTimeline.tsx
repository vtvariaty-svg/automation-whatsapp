'use client';

import type { FiscalTimelineEvent } from '@/lib/fiscal/types';

interface FiscalRequestTimelineProps {
  events: FiscalTimelineEvent[];
}

const EVENT_ICONS: Record<FiscalTimelineEvent['status'], string> = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  pending: '⏳',
  info: '💬',
};

const EVENT_COLORS: Record<FiscalTimelineEvent['status'], string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  pending: 'bg-blue-50 border-blue-200 text-blue-600',
  info: 'bg-gray-50 border-gray-200 text-gray-600',
};

const LINE_COLORS: Record<FiscalTimelineEvent['status'], string> = {
  success: 'bg-emerald-200',
  warning: 'bg-amber-200',
  error: 'bg-red-200',
  pending: 'bg-blue-200',
  info: 'bg-gray-200',
};

function formatTs(ts: string): string {
  try {
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

export default function FiscalRequestTimeline({ events }: FiscalRequestTimelineProps) {
  if (!events.length) return null;

  return (
    <div className="space-y-0">
      {events.map((event, idx) => (
        <div key={event.id} className="flex gap-4">
          {/* Line + Dot */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm flex-shrink-0 ${EVENT_COLORS[event.status]}`}
            >
              {EVENT_ICONS[event.status]}
            </div>
            {idx < events.length - 1 && (
              <div className={`w-0.5 flex-1 my-1 min-h-[16px] ${LINE_COLORS[event.status]}`} />
            )}
          </div>
          {/* Content */}
          <div className={`pb-4 ${idx < events.length - 1 ? '' : ''}`}>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{event.evento}</p>
            {event.descricao && (
              <p className="text-xs text-gray-500 mt-0.5">{event.descricao}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-1">{formatTs(event.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
