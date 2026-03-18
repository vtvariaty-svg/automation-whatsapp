import Link from "next/link";
import { MoveLeft, MailCheck } from "lucide-react";

export default function VerifyEmailPending() {
  return (
    <div className="flex min-h-screen bg-gray-50 flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifique seu e-mail</h2>
        <p className="text-sm text-gray-500 mb-8">
          Enviamos um link de verificação para o seu endereço de e-mail cadastrado. Por favor, cheque sua caixa de entrada (e a de spam) e clique no link para ativar sua conta.
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Ir para página de Login
          </Link>
          <Link
            href="/"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <MoveLeft className="w-4 h-4" /> Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
