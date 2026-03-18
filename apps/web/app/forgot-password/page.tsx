'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Ocorreu um erro. Tente novamente.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Falha ao conectar ao servidor. Verifique sua conexão.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col py-12 px-4 sm:px-6 lg:px-8">
      <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Login
      </Link>

      <div className="mx-auto mt-16 w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
        
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
          <KeyRound className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Esqueceu sua senha?</h2>
        <p className="text-center text-sm text-gray-500 mb-8">
          Digite o e-mail associado à sua conta e enviaremos um link seguro para você criar uma nova senha.
        </p>

        {status === 'success' ? (
          <div className="w-full bg-green-50 border border-green-100 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-2">
            <h3 className="font-semibold text-green-800 mb-2">E-mail enviado!</h3>
            <p className="text-sm text-green-700">
              Verifique a caixa de entrada do e-mail digitado. O link expira em 30 minutos.
            </p>
          </div>
        ) : (
          <form className="w-full space-y-4" onSubmit={handleSubmit}>
            {status === 'error' && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Endereço de E-mail
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full py-2.5"
                disabled={status === 'loading'}
              />
            </div>

            <Button type="submit" className="w-full py-3 mt-2" disabled={status === 'loading' || !email}>
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
