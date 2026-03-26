'use client';

import { useState, useEffect, useRef } from 'react';
import type { GuidedSetupAnswers } from '@/lib/ai/guidedSetup';

// ── Question definitions ───────────────────────────────────────────────────────

type QKey = keyof GuidedSetupAnswers;
type QType = 'text' | 'textarea' | 'options';
interface Option { value: string; label: string }
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
      { value: 'services', label: '📅 Serviços'   },
      { value: 'products', label: '🛒 Produtos'   },
      { value: 'both',     label: '🔀 Ambos'      },
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
      { value: 'never',      label: 'Só quando perguntada'            },
      { value: 'on_request', label: 'Sugere quando há interesse'      },
      { value: 'consultive', label: 'Oferece proativamente'           },
    ],
    required: true,
  },
  {
    key: 'pricePolicy',
    text: 'Como a IA deve tratar preços?',
    type: 'options',
    options: [
      { value: 'never',                label: 'Nunca menciona preços'  },
      { value: 'only_when_asked',      label: 'Só quando perguntada'   },
      { value: 'always_when_relevant', label: 'Quando relevante'       },
      { value: 'range_only',           label: 'Só faixa de preço'      },
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

function computeInitialIdx(init: Partial<GuidedSetupAnswers>): number {
  if (Object.keys(init).length === 0) return 0;
  // If loaded from API with data — show all as completed/editable
  for (let i = 0; i < QUESTIONS.length; i++) {
    const v = init[QUESTIONS[i].key];
    if (!v) return i;
  }
  return QUESTIONS.length;
}

function labelFor(q: Question, value: string): string {
  return q.type === 'options'
    ? (q.options?.find((o) => o.value === value)?.label ?? value)
    : value;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialAnswers?: Partial<GuidedSetupAnswers>;
  onChange?:       (answers: Partial<GuidedSetupAnswers>) => void;
  onComplete?:     (answers: Partial<GuidedSetupAnswers>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GuidedAiSetupChat({ initialAnswers, onChange, onComplete }: Props) {
  const [answers,    setAnswers]    = useState<Partial<GuidedSetupAnswers>>(initialAnswers ?? {});
  const [currentIdx, setCurrentIdx] = useState(() => computeInitialIdx(initialAnswers ?? {}));
  const [draft,      setDraft]      = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft,  setEditDraft]  = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIdx]);

  // Re-sync if parent reloads initialAnswers (e.g. after API response)
  const prevInit = useRef<Partial<GuidedSetupAnswers>>(initialAnswers ?? {});
  useEffect(() => {
    if (initialAnswers && initialAnswers !== prevInit.current) {
      prevInit.current = initialAnswers;
      setAnswers(initialAnswers);
      setCurrentIdx(computeInitialIdx(initialAnswers));
    }
  }, [initialAnswers]);

  const isDone   = currentIdx >= QUESTIONS.length;
  const answered = Object.keys(answers).length;
  const pct      = Math.round((answered / QUESTIONS.length) * 100);
  const allReqDone = REQUIRED_KEYS.every((k) => answers[k]);

  function commit(idx: number, value: string, advance: boolean) {
    const key     = QUESTIONS[idx].key;
    const updated = { ...answers, [key]: value as any };
    setAnswers(updated);
    onChange?.(updated);
    if (advance) {
      setDraft('');
      const next = idx + 1;
      setCurrentIdx(next);
      if (next >= QUESTIONS.length) onComplete?.(updated);
    }
  }

  function handleAnswer(value: string) {
    commit(currentIdx, value, true);
  }

  function handleSkip() {
    setDraft('');
    const next = currentIdx + 1;
    setCurrentIdx(next);
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
      // Remove the answer (user cleared it)
      const key = QUESTIONS[idx].key;
      const updated = { ...answers };
      delete updated[key];
      setAnswers(updated);
      onChange?.(updated);
    }
    setEditingIdx(null);
    setEditDraft('');
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

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

  function EditArea({ idx }: { idx: number }) {
    const q = QUESTIONS[idx];
    return (
      <div className="flex justify-end mt-1">
        <div className="max-w-sm w-full space-y-2">
          {q.type === 'options' ? (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {q.options?.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setEditDraft(o.value)}
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
          ) : q.type === 'textarea' ? (
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 resize-none"
              autoFocus
            />
          ) : (
            <input
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(idx); }}
              className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
              autoFocus
            />
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setEditingIdx(null); setEditDraft(''); }}
              className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => confirmEdit(idx)}
              disabled={q.required && !editDraft.trim()}
              className="text-xs bg-[#4f46e5] text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-all"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  }

  function ActiveInput() {
    const q = QUESTIONS[currentIdx];
    if (!q) return null;
    const preset = answers[q.key] as string | undefined;

    if (q.type === 'options') {
      return (
        <div className="pl-9 flex flex-wrap gap-2 mt-1">
          {q.options?.map((o) => (
            <button
              key={o.value}
              onClick={() => handleAnswer(o.value)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                o.value === preset
                  ? 'border-[#4f46e5] bg-indigo-50 text-[#4f46e5]'
                  : 'border-gray-200 bg-white hover:border-[#4f46e5] hover:bg-indigo-50 hover:text-[#4f46e5]'
              }`}
            >
              {o.label}
            </button>
          ))}
          {!q.required && (
            <button onClick={handleSkip} className="px-3.5 py-2 rounded-xl text-sm text-gray-400 border border-dashed border-gray-200 hover:text-gray-600 transition-all">
              Pular
            </button>
          )}
        </div>
      );
    }

    if (q.type === 'textarea') {
      return (
        <div className="pl-9 space-y-2 mt-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder={q.placeholder}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 resize-none transition-all"
            autoFocus
          />
          <div className="flex gap-2">
            {!q.required && (
              <button onClick={handleSkip} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-dashed border-gray-200 hover:text-gray-600 transition-all">
                Pular
              </button>
            )}
            <button
              onClick={() => { draft.trim() ? handleAnswer(draft.trim()) : handleSkip(); }}
              disabled={q.required && !draft.trim()}
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
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) handleAnswer(draft.trim()); }}
          placeholder={q.placeholder}
          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
          autoFocus
        />
        <div className="flex gap-2">
          {!q.required && (
            <button onClick={handleSkip} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-dashed border-gray-200 hover:text-gray-600 transition-all">
              Pular
            </button>
          )}
          <button
            onClick={() => { draft.trim() ? handleAnswer(draft.trim()) : handleSkip(); }}
            disabled={q.required && !draft.trim()}
            className="px-4 py-2 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-40"
          >
            Continuar →
          </button>
        </div>
      </div>
    );
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

        {/* Completed questions (0 .. currentIdx-1) */}
        {QUESTIONS.slice(0, currentIdx).map((q, idx) => {
          const val = answers[q.key] as string | undefined;
          const isEditing = editingIdx === idx;
          return (
            <div key={q.key} className="space-y-2">
              <AssistantBubble text={q.text} />
              {isEditing ? (
                <EditArea idx={idx} />
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
            <ActiveInput />
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
                ? 'Perfeito! Sua IA já conhece as regras do seu negócio. Clique em Salvar para aplicar.'
                : 'Quase lá! Algumas perguntas obrigatórias ainda não foram respondidas — edite acima para completar.'}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
