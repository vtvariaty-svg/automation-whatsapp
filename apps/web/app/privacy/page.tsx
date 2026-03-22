import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Política de Privacidade — Variaty Secretary IA",
  description: "Política de privacidade da plataforma Variaty Secretary IA.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Variaty Secretary" width={120} height={50} className="h-9 w-auto object-contain" />
          </Link>
          <Link href="/" className="text-sm text-[#4f46e5] hover:underline">← Voltar</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-gray-500 mb-12">Última atualização: 10 de março de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Informações que Coletamos</h2>
            <p>A Variaty Secretary IA coleta informações para fornecer e melhorar nossos serviços:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Dados de cadastro:</strong> nome, email, senha (criptografada) e dados da empresa.</li>
              <li><strong>Dados de integração:</strong> tokens de acesso ao WhatsApp Business, IDs de conta e números de telefone comerciais.</li>
              <li><strong>Dados de uso:</strong> logs de conversas, métricas de atendimento e interações com a plataforma.</li>
              <li><strong>Dados de login social:</strong> quando você utiliza Login com Facebook ou Instagram, recebemos seu nome, email e ID de perfil público.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Como Utilizamos suas Informações</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer, operar e manter a plataforma de automação de atendimento.</li>
              <li>Processar mensagens e interações via WhatsApp Business API.</li>
              <li>Treinar e personalizar o comportamento da IA de acordo com suas configurações.</li>
              <li>Enviar comunicações sobre atualizações, manutenção e novos recursos.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Compartilhamento de Dados</h2>
            <p>Não vendemos, alugamos ou comercializamos seus dados pessoais. Compartilhamos informações apenas com:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Meta Platforms (WhatsApp Business API):</strong> para envio e recebimento de mensagens.</li>
              <li><strong>OpenAI:</strong> para processamento de linguagem natural (mensagens processadas de forma anônima).</li>
              <li><strong>Provedores de infraestrutura:</strong> serviços de hospedagem e banco de dados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Segurança dos Dados</h2>
            <p>Implementamos medidas de segurança para proteger seus dados:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Criptografia de senhas com algoritmo bcrypt.</li>
              <li>Comunicação via HTTPS em toda a plataforma.</li>
              <li>Tokens de autenticação JWT com expiração.</li>
              <li>Acesso restrito por autenticação e autorização.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Seus Direitos (LGPD)</h2>
            <p>De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem o direito de:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Acessar seus dados pessoais armazenados.</li>
              <li>Solicitar correção de dados incompletos ou incorretos.</li>
              <li>Solicitar a exclusão dos seus dados pessoais.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
              <li>Solicitar a portabilidade dos dados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Retenção e Exclusão de Dados</h2>
            <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após o cancelamento, os dados são retidos por até 30 dias para eventual reativação, e depois permanentemente excluídos. Solicite a exclusão pelo painel de configurações ou contato com suporte.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Contato</h2>
            <p>Para questões sobre privacidade: <strong>contato@vtvariaty.com</strong></p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2026 Variaty Secretary IA. Todos os direitos reservados.
      </footer>
    </div>
  );
}
