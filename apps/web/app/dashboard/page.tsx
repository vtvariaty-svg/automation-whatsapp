import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bem vindo ao painel</CardTitle>
          <CardDescription>Selecione uma opção no menu lateral para começar.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-center">
          <CardHeader className="mb-0">
            <CardTitle className="text-lg">Status da integração</CardTitle>
            <p className="text-green-500 font-medium mt-2">Webhook ativo</p>
          </CardHeader>
        </Card>
        <Card className="flex flex-col justify-center">
          <CardHeader className="mb-0">
            <CardTitle className="text-lg">Configuração de IA</CardTitle>
            <p className={`font-medium mt-2 ${process.env.OPENAI_API_KEY ? "text-green-500" : "text-yellow-600"}`}>
              {process.env.OPENAI_API_KEY ? "IA Configurada" : "IA não configurada"}
            </p>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
