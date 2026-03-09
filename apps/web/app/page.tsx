import Link from "next/link";
import Button from "@/components/Button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        AI WhatsApp Assistant
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl">
        Automatize atendimento, pedidos e agendamentos com IA
      </p>
      <Link href="/login">
        <Button variant="primary" className="text-lg px-8 py-3">
          Começar
        </Button>
      </Link>
    </div>
  );
}
