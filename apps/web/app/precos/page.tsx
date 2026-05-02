import MetaPixel from "@/components/marketing/MetaPixel";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { PrecosSection } from "@/components/marketing/landing/PrecosSection";
import { CTASection } from "@/components/marketing/landing/CTASection";
import { Footer } from "@/components/marketing/landing/Footer";

export const metadata = {
  title: "Planos e Preços | Variaty — Consultório e Restaurante",
  description: "Plano Consultório e Plano Restaurante com 7 dias de teste grátis. Automatize atendimento via WhatsApp para clínicas, consultórios, restaurantes e delivery.",
};

export default function PrecosPage() {
  return (
    <main className="bg-white min-h-screen selection:bg-blue-200 selection:text-blue-900 font-sans">
      <MetaPixel />
      <Navbar />
      <div className="pt-20">
        <PrecosSection />
      </div>
      <CTASection />
      <Footer />
    </main>
  );
}
