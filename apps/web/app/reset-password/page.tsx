'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Se não existir token na URL, bloqueia a UI
  if (!token) {
    return (
      <div className="text-center py-6">
        <h3 className="text-xl font-bold text-red-600 mb-2">Link Inválido</h3>
        <p className="text-sm text-gray-500 mb-6">Nenhum token foi fornecido na URL ou este link está quebrado.</p>
        <Link href="/forgot-password" className="text-indigo-600 font-medium hover:underline text-sm">
          Solicitar um novo link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage('Sua senha deve ter no mínimo 6 caracteres.');
      setStatus('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Não foi possível redefinir sua senha.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Ocorreu um erro de rede. Verifique sua conexão e tente novamente.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center animate-in fade-in slide-in-from-bottom-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
             <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Senha alterada!</h3>
        <p className="text-sm text-gray-500 mb-6">Você redefiniu sua senha com segurança.</p>
        <Link 
          href="/login"
          className="w-full flex justify-center items-center py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-sm"
        >
          Fazer Login Agora
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
        <ShieldCheck className="w-6 h-6" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Criar nova senha</h2>
      <p className="text-center text-sm text-gray-500 mb-8">
        Digite sua nova senha de acesso à plataforma abaixo.
      </p>

      <form className="w-full space-y-5" onSubmit={handleSubmit}>
        {status === 'error' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
          <Input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
            className="w-full py-2.5"
            disabled={status === 'loading'}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
          <Input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Digite a mesma senha"
            className="w-full py-2.5"
            disabled={status === 'loading'}
          />
        </div>

        <Button type="submit" className="w-full py-3 mt-2" disabled={status === 'loading' || !newPassword || !confirmPassword}>
          {status === 'loading' ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
          ) : (
            'Redefinir Senha'
          )}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen bg-gray-50 flex-col py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto mt-16 w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
        <Suspense fallback={
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
