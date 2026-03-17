'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useEntitlements } from '@/hooks/useEntitlements';
import { FEATURE_UPGRADE_MESSAGES } from '@/lib/config/plans';
import UpgradeGate from '@/components/UpgradeGate';

interface Template {
  name: string;
  category: string;
  language: string;
  status: string;
  body: string;
  placeholders: string[];
  placeholderLabels?: string[];
}

type SendStatus = 'idle' | 'loading' | 'success' | 'error';

export default function TemplatesPage() {
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const ent = useEntitlements();

  if (!ent.loading && !ent.features.whatsapp) {
    return <UpgradeGate icon="📋" title="Templates WhatsApp" message={FEATURE_UPGRADE_MESSAGES.whatsapp} ctaPlan="Standard" />;
  }

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [recipient, setRecipient] = useState('');
  const [variables, setVariables] = useState<string[]>([]);

  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [sendResult, setSendResult] = useState<{ messageId?: string; error?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchTemplates();
  }, [token]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/whatsapp/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load templates');
      }
      const data: Template[] = await res.json();
      // Only show APPROVED templates
      setTemplates(data.filter(t => t.status === 'APPROVED'));
    } catch (e: any) {
      setFetchError(e.message);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSelectTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl);
    setVariables(tpl.placeholders.map(() => ''));
    setSendStatus('idle');
    setSendResult(null);
  };

  const getPreviewText = () => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.body;
    selectedTemplate.placeholders.forEach((ph, i) => {
      text = text.replace(ph, variables[i] || ph);
    });
    return text;
  };

  const handleSend = async () => {
    if (!selectedTemplate || !recipient.trim()) return;

    setSendStatus('loading');
    setSendResult(null);

    try {
      const res = await fetch('/api/whatsapp/templates/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          to: recipient.replace(/\D/g, ''),
          templateName: selectedTemplate.name,
          language: selectedTemplate.language,
          variables: variables.filter(v => v.length > 0),
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send template');
      }

      setSendStatus('success');
      setSendResult({ messageId: data.messageId });
    } catch (e: any) {
      setSendStatus('error');
      setSendResult({ error: e.message });
    }
  };

  const categoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      UTILITY: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      MARKETING: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      AUTHENTICATION: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return colors[cat] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
          WhatsApp Templates
        </h1>
        <p className="text-gray-400 mt-2">
          Select a template, fill in the placeholders, and send it to a recipient.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN — Template Selection */}
        <div className="space-y-6">
          {/* Recipient */}
          <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              📱 Recipient Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. 5511999999999"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1.5">International format without + sign</p>
          </div>

          {/* Template Selector */}
          <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              📝 Select Template
            </label>

            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : fetchError ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {fetchError}
              </div>
            ) : templates.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No approved templates found in your WABA.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {templates.map((tpl) => (
                  <button
                    key={`${tpl.name}-${tpl.language}`}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedTemplate?.name === tpl.name && selectedTemplate?.language === tpl.language
                        ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
                        : 'bg-[#1a1a1a] border-white/5 hover:border-white/10 hover:bg-[#1e1e1e]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-sm">{tpl.name}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${categoryBadge(tpl.category)}`}>
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{tpl.body || 'No body text'}</p>
                    <p className="text-[10px] text-gray-600 mt-1">Language: {tpl.language}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Preview & Send */}
        <div className="space-y-6">
          {selectedTemplate ? (
            <>
              {/* Template Info */}
              <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">{selectedTemplate.name}</h2>
                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${categoryBadge(selectedTemplate.category)}`}>
                    {selectedTemplate.category}
                  </span>
                </div>

                {/* Preview */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4 border border-white/5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Template Preview</p>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {getPreviewText()}
                  </p>
                </div>

                <p className="text-[11px] text-gray-500">
                  Language: <span className="text-gray-400">{selectedTemplate.language}</span>
                </p>
              </div>

              {/* Placeholders */}
              {selectedTemplate.placeholders.length > 0 && (
                <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">🔤 Template Variables</h3>
                  <div className="space-y-3">
                    {selectedTemplate.placeholders.map((ph, index) => (
                      <div key={ph}>
                        <label className="block text-xs text-gray-500 mb-1">
                          {selectedTemplate.placeholderLabels?.[index] || `Variable ${index + 1}`} <span className="text-gray-600">({ph})</span>
                        </label>
                        <input
                          type="text"
                          placeholder={`Value for ${ph}`}
                          value={variables[index] || ''}
                          onChange={(e) => {
                            const newVars = [...variables];
                            newVars[index] = e.target.value;
                            setVariables(newVars);
                          }}
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={sendStatus === 'loading' || !recipient.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                  sendStatus === 'loading'
                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                    : !recipient.trim()
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
                }`}
              >
                {sendStatus === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </span>
                ) : (
                  '📨 Send Template'
                )}
              </button>

              {/* Result Feedback */}
              {sendStatus === 'success' && sendResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-400 text-lg">✅</span>
                    <span className="font-bold text-emerald-400">Template Sent Successfully!</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Status: <span className="text-emerald-300 font-medium">Accepted</span>
                  </p>
                  {sendResult.messageId && (
                    <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                      Message ID: {sendResult.messageId}
                    </p>
                  )}
                </div>
              )}

              {sendStatus === 'error' && sendResult && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-400 text-lg">❌</span>
                    <span className="font-bold text-red-400">Failed to Send</span>
                  </div>
                  <p className="text-sm text-red-300">{sendResult.error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#121212] rounded-2xl border border-white/5 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Template Selected</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Select a template from the list on the left to preview its content and send it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
