'use client';

import { useState, useEffect, useRef } from 'react';
import type { GuidedSetupAnswers } from '@/lib/ai/guidedSetup';

// ── Question definitions ────────────────────────────────────────────────────

type QKey  = keyof GuidedSetupAnswers;
type QType = 'text' | 'textarea' | 'options';
interface Option   { value: string; label: string }
interface Question { key: QKey; text: string; type: QType; placeholder?: string; options?: Option[]; required: boolean }

const QUESTIONS: Question[] = [
  {
    key: 'companyName',
    text: 'Qual é o nome do seu negócio?',
    type: 'text',
    placeholder: 'Ex: Studio Bella, Clínica São Lucas...',
    required: true,
  },
  {
    key: 'niche',
    text: 'Em qual segmento você atua?',
    type: 'options',
    options: [
      { value: 'estética',        label: '✨ Estética & Beleza'      },
      { value: 'saúde',           label: '🏥 Saúde & Clínica'        },
      { value: 'restaurante',     label: '🍽️ Restaurante / Delivery' },
      { value: 'serviços locais', label: '🔧 Serviços Locais'        },
      { value: 'infoproduto',     label: '🚀 Infoproduto / Educação' },
      { value: 'loja',            label: '🛍️ Comércio / Loja'       },
      { value: 'outro',           label: '💼 Outro'                  },
    ],
    required: true,
  },
  {
    key: 'businessModel',
    text: 'Você oferece serviços, produtos ou ambos?',
    type: 'options',
    options: [
      { value: 'services', label: '📅 Serviços' },
      { value: 'products', label: '🛒 Produtos' },
      { value: 'both',     label: '🔀 Ambos'    },
    ],
    required: true,
  },
  {
    key: 'offeringsSummary',
    text: 'Descreva brevemente o que você oferece:',
    type: 'textarea',
    placeholder: 'Ex: Corte, coloração e tratamentos capilares para mulheres...',
    required: false,
  },
  {
    key: 'offerMode',
    text: 'Como a IA deve oferecer seus produtos/serviços?',
    type: 'options',
    options: [
      { value: 'never',      label: 'Só quando perguntada'       },
      { value: 'on_request', label: 'Sugere quando há interesse' },
      { value: 'consultive', label: 'Oferece proativamente'      },
    ],
    required: true,
  },
  {
    key: 'pricePolicy',
    text: 'Como a IA deve tratar preços?',
    type: 'options',
    options: [
      { value: 'never',                label: 'Nunca menciona preços' },
      { value: 'only_when_asked',      label: 'Só quando perguntada'  },
      { value: 'always_when_relevant', label: 'Quando relevante'      },
      { value: 'range_only',           label: 'Só faixa de preço'     },
    ],
    required: true,
  },
  {
    key: 'businessHours',
    text: 'Qual é o horário de atendimento?',
    type: 'text',
    placeholder: 'Ex: Seg–Sex: 9h–18h, Sáb: 9h–13h',
    required: false,
  },
  {
    key: 'toneOfVoice',
    text: 'Qual tom de comunicação combina com a sua marca?',
    type: 'options',
    options: [
      { value: 'professional', label: '👔 Profissional' },
      { value: 'friendly',     label: '😊 Amigável'     },
      { value: 'premium',      label: '✨ Premium'      },
      { value: 'direct',       label: '⚡ Direto'       },
    ],
    required: true,
  },
  {
    key: 'mainDifferential',
    text: 'Qual é o principal diferencial do seu negócio?',
    type: 'textarea',
    placeholder: 'Ex: 10 anos de experiência, atendimento humanizado, maior variedade da região...',
    required: false,
  },
];

const REQUIRED_KEYS = QUESTIONS.filter((q) => q.required).map((q) => q.key);

// ── localStorage helpers ────────────────────────────────────────────────────

interface PersistedDraft {
  answers: Partial<GuidedSetupAnswers>;
  currentIdx: number;
}

function readDraft(key: string): PersistedDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedDraft;
  } catch { return null; }
}

function writeDraft(key: string, draft: PersistedDraft) {
  try { localStorage.setItem(key, JSON.stringify(draft)); } catch {}
}

// ── computeInitialIdx — finds the furthest valid position, not the first gap ─

/**
 * Returns the index of the next unanswered question.
 * Uses the LAST answered question as the baseline (not the first gap),
 * so skipped optional questions don't break the flow.
 * `storedIdx` from localStorage takes precedence when it points further ahead.
 */
function computeInitialIdx(
  init: Partial<GuidedSetupAnswers>,
  storedIdx?: number,
): number {
  if (Object.keys(init).length === 0) return storedIdx ?? 0;

  let lastAnswered = -1;
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (init[QUESTIONS[i].key] !== undefined) lastAnswered = i;
  }

  const fromAnswers = lastAnswered + 1; // advances past the last answered
  const result = Math.max(fromAnswers, storedIdx ?? 0);
  return Math.min(result, QUESTIONS.length);
}

function labelFor(q: Question, value: string): string {
  return q.type === 'options'
    ? (q.options?.find((o) => o.value === value)?.label ?? value)
    : value;
}

// ── Module-level sub-components ─────────────────────────────────────────────
// IMPORTANT: these MUST live outside GuidedAiSetupChat.
// Defining components inside a render function causes React to treat them as
// new types on every render → unmount/remount → lost focus, caret jumps, "text backwards".

function AssistantBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold text-white">
        IA
      </div>
      <div className="bg-gray-100 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm text-gray-700 max-w-sm leading-snug">
        {text}
      </div>
    </div>
  );
}

function UserBubble({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <div className="flex justify-end items-start gap-2">
      <button onClick={onEdit} className="mt-1.5 text-gray-300 hover:text-gray-500 transition-colors" title="Editar">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <div className="bg-[#4f46e5] text-white rounded-xl rounded-tr-sm px-3.5 py-2.5 text-sm max-w-sm leading-snug">
        {label}
      </div>
    </div>
  );
}

interface EditAreaProps {
  idx: number;
  question: Question;
  editDraft: string;
  onDraftChange: (v: string) => void;
  onConfirm: (idx: number) => void;
  onCancel: () => void;
}

function EditArea({ idx, question, editDraft, onDraftChange, onConfirm, onCancel }: EditAreaProps) {
  return (
    <div className="flex justify-end mt-1">
      <div className="max-w-sm w-full space-y-2">
        {question.type === 'options' ? (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {question.options?.map((o) => (
              <button
                key={o.value}
                onClick={() => onDraftChange(o.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  editDraft === o.value
                    ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : question.type === 'textarea' ? (
          <textarea
            value={editDraft}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={2}
            dir="ltr"
            className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 resize-none"
            autoFocus
          />
        ) : (
          <input
            value={editDraft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(idx); }}
            dir="ltr"
            className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
            autoFocus
          />
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(idx)}
            disabled={question.required && !editDraft.trim()}
            className="text-xs bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-all"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActiveInputProps {
  question: Question;
  draft: string;
  onDraftChange: (v: string) => void;
  onAnswer: (value: string) => void;
  onSkip: () => void;
}

function ActiveInput({ question, draft, onDraftChange, onAnswer, onSkip }: ActiveInputProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const taRef     = useRef<HTMLTextAreaElement>(null);

  // Focus the input whenever the active question changes
  useEffect(() => {
    inputRef.current?.focus();
    taRef.current?.focus();
  }, [question.key]);

  if (question.type === 'options') {
    return (
      <div className="pl-9 flex flex-wrap gap-2 mt-1">
        {question.options?.map((o) => (
          <button
            key={o.value}
            onClick={() => onAnswer(o.value)}
            className="px-3.5 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:border-[#4f46e5] hover:bg-indigo-50 hover:text-[#4f46e5] transition-all"
          >
            {o.label}
          </button>
        ))}
        {!question.required && (
          <button onClick={onSkip} className="px-3.5 py-2 rounded-xl text-sm text-gray-400 border border-dashed border-gray-200 hover:text-gray-600 transition-all">
            Pular
          </button>
        )}
      </div>
    );
  }

  if (question.type === 'textarea') {
    return (
      <div className="pl-9 space-y-2 mt-1">
        <textarea
          ref={taRef}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={3}
          dir="ltr"
          placeholder={question.placeholder}
          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 resize-none transition-all"
        />
        <div className="flex gap-2">
          {!question.required && (
            <button onClick={onSkip} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-dashed border-gray-200 hover:text-gray-600 transition-all">
              Pular
            </button>
          )}
          <button
            onClick={() => { draft.trim() ? onAnswer(draft.trim()) : onSkip(); }}
            disabled={question.required && !draft.trim()}
            className="px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-40"
          >
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  // text
  return (
    <div className="pl-9 space-y-2 mt-1">
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) onAnswer(draft.trim()); }}
        dir="ltr"
        placeholder={question.placeholder}
        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
      />
      <div className="flex gap-2">
        {!question.required && (
          <button onClick={onSkip} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-dashed border-gray-200 hover:text-gray-600 transition-all">
            Pular
          </button>
        )}
        <button
          onClick={() => { draft.trim() ? onAnswer(draft.trim()) : onSkip(); }}
          disabled={question.required && !draft.trim()}
          className="px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-40"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  initialAnswers?: Partial<GuidedSetupAnswers>;
  /** localStorage key for draft persistence, e.g. `guided_ai_setup_draft:${tenantId}` */
  persistKey?:  string;
  onAutoSave?:  (answers: Partial<GuidedSetupAnswers>) => void;
  onChange?:    (answers: Partial<GuidedSetupAnswers>) => void;
  onComplete?:  (answers: Partial<GuidedSetupAnswers>) => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function GuidedAiSetupChat({
  initialAnswers,
  persistKey,
  onAutoSave,
  onChange,
  onComplete,
}: Props) {
  // ── State init: reconcile server answers + localStorage draft ──────────────
  const [answers, setAnswers] = useState<Partial<GuidedSetupAnswers>>(() => {
    const server = initialAnswers ?? {};
    if (!persistKey) return server;
    const stored = readDraft(persistKey);
    if (!stored) return server;
    // Local draft wins (more recent progress), server fills gaps
    return { ...server, ...stored.answers };
  });

  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    const server = initialAnswers ?? {};
    if (!persistKey) return computeInitialIdx(server);
    const stored = readDraft(persistKey);
    const merged = { ...server, ...(stored?.answers ?? {}) };
    return computeInitialIdx(merged, stored?.currentIdx);
  });

  const [draft,      setDraft]      = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft,  setEditDraft]  = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Track whether the server has hydrated with non-empty data
  const serverHydrated = useRef(Object.keys(initialAnswers ?? {}).length > 0);

  // ── Scroll to bottom on advance ────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIdx]);

  // ── One-time server hydration (fires only when server delivers first data) ─
  // This does NOT fire on every prop change — it's guarded by serverHydrated.
  // This breaks the circular: page.onChange → setGuidedSetup → new prop ref → re-sync loop.
  useEffect(() => {
    if (serverHydrated.current) return; // already hydrated — ignore all future changes
    if (!initialAnswers || Object.keys(initialAnswers).length === 0) return;

    // First non-empty server data arrived
    serverHydrated.current = true;
    const stored = persistKey ? readDraft(persistKey) : null;
    const merged = { ...initialAnswers, ...(stored?.answers ?? {}) };
    setAnswers(merged);
    setCurrentIdx(computeInitialIdx(merged, stored?.currentIdx));
  }, [initialAnswers, persistKey]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isDone     = currentIdx >= QUESTIONS.length;
  const answered   = Object.keys(answers).length;
  const pct        = Math.round((answered / QUESTIONS.length) * 100);
  const allReqDone = REQUIRED_KEYS.every((k) => answers[k]);

  // ── commit — central state update + persist ────────────────────────────────
  function commit(idx: number, value: string, advance: boolean) {
    const key     = QUESTIONS[idx].key;
    const updated = { ...answers, [key]: value as any };
    const nextIdx = advance ? idx + 1 : currentIdx;

    setAnswers(updated);
    if (advance) {
      setDraft('');
      setCurrentIdx(nextIdx);
      if (nextIdx >= QUESTIONS.length) onComplete?.(updated);
    }

    onChange?.(updated);
    onAutoSave?.(updated);

    if (persistKey) {
      writeDraft(persistKey, { answers: updated, currentIdx: nextIdx });
    }
  }

  function handleAnswer(value: string) {
    commit(currentIdx, value, true);
  }

  function handleSkip() {
    setDraft('');
    const next = currentIdx + 1;
    setCurrentIdx(next);

    if (persistKey) writeDraft(persistKey, { answers, currentIdx: next });
    if (next >= QUESTIONS.length) onComplete?.(answers);
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditDraft(String(answers[QUESTIONS[idx].key] ?? ''));
  }

  function confirmEdit(idx: number) {
    const trimmed = editDraft.trim();
    if (trimmed) {
      commit(idx, trimmed, false);
    } else {
      const key     = QUESTIONS[idx].key;
      const updated = { ...answers };
      delete updated[key];
      setAnswers(updated);
      onChange?.(updated);
      onAutoSave?.(updated);
      if (persistKey) writeDraft(persistKey, { answers: updated, currentIdx });
    }
    setEditingIdx(null);
    setEditDraft('');
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{answered}/{QUESTIONS.length}</span>
      </div>

      {/* Chat messages */}
      <div className="space-y-5 max-h-[480px] overflow-y-auto pr-1 scroll-smooth">

        {/* Completed questions */}
        {QUESTIONS.slice(0, currentIdx).map((q, idx) => {
          const val       = answers[q.key] as string | undefined;
          const isEditing = editingIdx === idx;
          return (
            <div key={q.key} className="space-y-2">
              <AssistantBubble text={q.text} />
              {isEditing ? (
                <EditArea
                  idx={idx}
                  question={q}
                  editDraft={editDraft}
                  onDraftChange={setEditDraft}
                  onConfirm={confirmEdit}
                  onCancel={() => { setEditingIdx(null); setEditDraft(''); }}
                />
              ) : val ? (
                <UserBubble label={labelFor(q, val)} onEdit={() => startEdit(idx)} />
              ) : (
                <div className="flex justify-end">
                  <span className="text-xs text-gray-400 italic pr-1">pulado</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Current active question */}
        {!isDone && (
          <div className="space-y-2">
            <AssistantBubble text={QUESTIONS[currentIdx].text} />
            <ActiveInput
              question={QUESTIONS[currentIdx]}
              draft={draft}
              onDraftChange={setDraft}
              onAnswer={handleAnswer}
              onSkip={handleSkip}
            />
          </div>
        )}

        {/* Completion state */}
        {isDone && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-xs shrink-0 mt-0.5 text-white font-bold">
              ✓
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm text-emerald-700 leading-snug">
              {allReqDone
                ? 'Perfeito! Sua IA já conhece as regras do seu negócio. Salvando automaticamente...'
                : 'Quase lá! Algumas perguntas obrigatórias ainda não foram respondidas — edite acima para completar.'}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
