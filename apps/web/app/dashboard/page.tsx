export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Bem vindo ao painel</h2>
        <p className="text-gray-600">Selecione uma opção no menu lateral para começar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Status da integração</h3>
          <p className="text-green-500 font-medium">Webhook ativo</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Configuração de IA</h3>
          <p className="text-yellow-600 font-medium">IA não configurada</p>
        </div>
      </div>
    </div>
  );
}
