export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Política de Privacidade</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
        <p><strong>Última atualização:</strong> 10 de março de 2026</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">1. Informações que coletamos</h2>
        <p>
          Coletamos informações que você nos fornece diretamente ao utilizar nossa plataforma,
          incluindo dados de cadastro (nome, e-mail), informações de integração com WhatsApp Business
          API (tokens de acesso, IDs de conta e número de telefone) e dados de mensagens processadas
          pela plataforma.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">2. Como usamos suas informações</h2>
        <p>Utilizamos as informações coletadas para:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Fornecer, manter e melhorar nossos serviços</li>
          <li>Processar e rotear mensagens do WhatsApp</li>
          <li>Integrar com serviços de inteligência artificial para automação de atendimento</li>
          <li>Enviar comunicações relacionadas ao serviço</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Compartilhamento de dados</h2>
        <p>
          Não vendemos suas informações pessoais. Compartilhamos dados apenas com:
          a Meta/WhatsApp (para funcionamento da API), provedores de IA (para processamento de mensagens)
          e quando exigido por lei.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">4. Segurança dos dados</h2>
        <p>
          Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações,
          incluindo criptografia de dados em trânsito e em repouso.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">5. Seus direitos</h2>
        <p>
          Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento.
          Para exercer esses direitos, entre em contato conosco pelo e-mail disponível nas configurações
          da sua conta.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">6. Exclusão de dados</h2>
        <p>
          Você pode solicitar a exclusão completa dos seus dados a qualquer momento. Após a solicitação,
          removeremos seus dados em até 30 dias úteis.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8">7. Contato</h2>
        <p>
          Para dúvidas sobre esta política, entre em contato pelo e-mail: suporte@vtvariaty.com
        </p>
      </div>
    </div>
  );
}
