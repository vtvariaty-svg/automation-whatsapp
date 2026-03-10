import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Dashboard
        </Link>
        <Link href="/dashboard/conversations" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Inbox / Conversas
        </Link>
        <Link href="/dashboard/pedidos" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Pedidos
        </Link>
        <Link href="/dashboard/agenda" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Agenda
        </Link>
        <Link href="/dashboard/ai-test" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Teste IA
        </Link>
        <Link href="/dashboard/ai" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Configuração de IA
        </Link>
        <Link href="/dashboard/integrations" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Integrações (WhatsApp)
        </Link>
        <Link href="/dashboard/products" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Produtos
        </Link>
        <Link href="/dashboard/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Configurações
        </Link>
      </nav>
    </aside>
  );
}
