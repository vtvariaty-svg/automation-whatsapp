import { redirect } from "next/navigation";

export default function AutomationsPage() {
  redirect("/dashboard/vendas?tab=automacoes");
}
