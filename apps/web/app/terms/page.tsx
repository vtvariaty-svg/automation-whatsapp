import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Termos de Serviço — Variaty Secretary IA",
  description: "Termos de serviço da plataforma Variaty Secretary IA.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/logo.webp" alt="Variaty Secretary" className="h-20 w-auto" />
          </Link>
          <Link href="/" className="text-sm text-[#4f46e5] hover:underline">← Voltar</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Termos de Serviço</h1>
        <p className="text-gray-500 mb-12">Última atualização: 10 de março de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
            <p>Ao acessar ou utilizar a plataforma Variaty Secretary IA, você concorda com estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não utilize a plataforma.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Descrição do Serviço</h2>
            <p>A Variaty Secretary IA é uma plataforma SaaS que oferece:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Automação de atendimento ao cliente via WhatsApp Business API.</li>
              <li>Inteligência Artificial para respostas automáticas e contextualizada.</li>
              <li>Gerenciamento de conversas, agendamentos e vendas.</li>
              <li>Integração com plataformas de e-commerce e redes sociais.</li>
              <li>Painel de análise e métricas de atendimento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Conta e Cadastro</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Você é responsável por manter a confidencialidade da sua conta e senha.</li>
              <li>Deve fornecer informações verdadeiras e atualizadas no cadastro.</li>
              <li>É proibido criar múltiplas contas para burlar limitações de plano.</li>
              <li>Você é responsável por todas as atividades realizadas em sua conta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Planos e Pagamento</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Todos os planos incluem um período de teste gratuito de 7 dias.</li>
              <li>Após o período de teste, a cobrança é mensal e recorrente.</li>
              <li>Você pode cancelar sua assinatura a qualquer momento.</li>
              <li>Não há reembolso parcial de períodos já pagos.</li>
              <li>Reservamo-nos o direito de ajustar os preços com aviso prévio de 30 dias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Uso Aceitável</h2>
            <p>Você concorda em NÃO utilizar a plataforma para:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Enviar spam, mensagens não solicitadas ou conteúdo ilegal.</li>
              <li>Violar as Políticas de Negócios do WhatsApp ou termos da Meta.</li>
              <li>Coletar informações pessoais de terceiros sem consentimento.</li>
              <li>Interferir no funcionamento da plataforma ou acessar dados de outros usuários.</li>
              <li>Revender o acesso à plataforma sem autorização prévia.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Inteligência Artificial</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>A IA gera respostas com base na configuração fornecida pelo usuário.</li>
              <li>Não garantimos 100% de precisão nas respostas da IA.</li>
              <li>O usuário é responsável por configurar e supervisionar a IA adequadamente.</li>
              <li>Recomendamos revisão periódica das respostas automatizadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Propriedade Intelectual</h2>
            <p>Todo o conteúdo, design, código e funcionalidades da plataforma são propriedade da Variaty Secretary IA. É proibida a reprodução, cópia ou distribuição sem autorização prévia.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Limitação de Responsabilidade</h2>
            <p>A Variaty Secretary IA não se responsabiliza por:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Perdas causadas por indisponibilidade temporária do serviço.</li>
              <li>Ações ou decisões tomadas com base nas respostas da IA.</li>
              <li>Alterações nas políticas ou APIs de terceiros (Meta, OpenAI).</li>
              <li>Danos indiretos, incidentais ou consequenciais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Cancelamento e Encerramento</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Você pode cancelar sua conta a qualquer momento pelas configurações.</li>
              <li>Reservamo-nos o direito de suspender contas que violem estes termos.</li>
              <li>Após cancelamento, seus dados serão retidos por 30 dias e depois excluídos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Legislação Aplicável</h2>
            <p>Estes termos são regidos pela legislação da República Federativa do Brasil. Fica eleito o foro da comarca do domicílio do usuário para dirimir quaisquer dúvidas ou litígios.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Contato</h2>
            <p>Para dúvidas sobre estes termos: <strong>contato@vtvariaty.com</strong></p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400 flex flex-col gap-1">
        <p>© 2026 Variaty. Todos os direitos reservados.</p>
        <p className="text-xs">
          Contamei Tecnologia e Sistemas Digitais LTDA — CNPJ 64.790.325/0001-06 — Celular: (16) 99436-7481
        </p>
      </footer>
    </div>
  );
}
