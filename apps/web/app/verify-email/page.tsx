'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu e-mail...');
  
  // Utilizando useRef para evitar chamadas duplas no StrictMode do React
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Nenhum token fornecido na URL.');
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage('Oba! Seu e-mail foi verificado com sucesso.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Não foi possível verificar seu e-mail.');
        }
      })
      .catch((error) => {
        setStatus('error');
        setMessage('Ocorreu um erro ao processar a requisição de verificação.');
      });
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
      <div className="flex justify-center mb-6">
        {status === 'loading' && (
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}
        {status === 'success' && (
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center animate-in zoom-in">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        )}
        {status === 'error' && (
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center animate-in zoom-in">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {status === 'loading' ? 'Aguarde' : status === 'success' ? 'Conta ativada!' : 'Erro na Verificação'}
      </h2>
      <p className="text-sm text-gray-500 mb-8">{message}</p>

      <div className="space-y-4">
        {status === 'success' ? (
           <Link
             href="/login"
             className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
           >
             Fazer Login
           </Link>
        ) : (
          <Link
            href="/login"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Voltar para o Login
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen bg-gray-50 flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="mx-auto w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
           <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
