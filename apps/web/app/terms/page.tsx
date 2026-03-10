export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Termos de Serviço</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
        <p><strong>Última atualização:</strong> 10 de março de 2026</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e utilizar a plataforma VTvariaty, você concorda com estes Termos de Serviço.
          Se não concordar com algum dos termos, não utilize o serviço.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">2. Descrição do Serviço</h2>
        <p>
          A VTvariaty oferece uma plataforma de automação de atendimento via WhatsApp Business,
          incluindo integração com inteligência artificial, gerenciamento de conversas e
          ferramentas de produtividade para equipes de atendimento.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Responsabilidades do Usuário</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Manter a segurança de suas credenciais de acesso</li>
          <li>Utilizar o serviço em conformidade com as políticas do WhatsApp Business</li>
          <li>Não utilizar o serviço para envio de spam ou mensagens não solicitadas</li>
          <li>Respeitar a legislação vigente de proteção de dados (LGPD)</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">4. Integração com WhatsApp</h2>
        <p>
          A utilização da API do WhatsApp Business está sujeita às políticas e termos da Meta.
          O usuário é responsável por garantir que o uso está em conformidade com as
          diretrizes da plataforma WhatsApp Business.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">5. Limitação de Responsabilidade</h2>
        <p>
          A VTvariaty não se responsabiliza por interrupções de serviço causadas por terceiros
          (Meta, provedores de IA ou infraestrutura de hospedagem), nem por perdas decorrentes
          do uso inadequado da plataforma.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">6. Modificações</h2>
        <p>
          Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos
          os usuários sobre alterações significativas por e-mail ou através da plataforma.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">7. Contato</h2>
        <p>
          Para dúvidas sobre estes termos, entre em contato pelo e-mail: suporte@vtvariaty.com
        </p>
      </div>
    </div>
  );
}
