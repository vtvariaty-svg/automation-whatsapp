'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'bug' | 'sugestão' | 'onboarding' | 'integração' | 'cobrança';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bug', label: 'Bug / Erro' },
  { value: 'sugestão', label: 'Sugestão' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'integração', label: 'Integração' },
  { value: 'cobrança', label: 'Cobrança' },
];

const SCORE_EMOJIS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Péssimo' },
  { value: 2, emoji: '😕', label: 'Ruim' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '🙂', label: 'Bom' },
  { value: 5, emoji: '😄', label: 'Ótimo' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<Category>('sugestão');
  const [body, setBody] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only render if a token exists in localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setIsAuthenticated(Boolean(token));
    }
  }, []);

  // Auto-close after success
  useEffect(() => {
    if (success) {
      closeTimerRef.current = setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        resetForm();
      }, 2000);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [success]);

  function resetForm() {
    setCategory('sugestão');
    setBody('');
    setScore(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          body: body.trim(),
          score: score ?? undefined,
          route: window.location.pathname,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      }
    } catch {
      // Silently fail — feedback widget should not disrupt the user
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Abrir formulário de feedback"
      >
        <span>💬</span>
        <span>Feedback</span>
      </button>

      {/* Modal/Popover */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-indigo-600 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Como podemos melhorar?</h2>
            <button
              onClick={() => { setIsOpen(false); resetForm(); setSuccess(false); }}
              className="text-indigo-200 hover:text-white transition-colors text-lg leading-none"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {success ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="text-4xl mb-2">🙏</span>
                <p className="text-sm font-medium text-gray-800">Obrigado pelo feedback!</p>
                <p className="text-xs text-gray-500 mt-1">Isso nos ajuda a melhorar.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mensagem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows={3}
                    placeholder="Descreva sua sugestão, problema ou dúvida..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Score */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Satisfação (opcional)
                  </label>
                  <div className="flex gap-1.5">
                    {SCORE_EMOJIS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        title={s.label}
                        onClick={() => setScore(score === s.value ? null : s.value)}
                        className={`flex-1 rounded-lg border py-1.5 text-lg transition-colors ${
                          score === s.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                      >
                        {s.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !body.trim()}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
