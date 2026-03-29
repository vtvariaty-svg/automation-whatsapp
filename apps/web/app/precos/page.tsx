import MetaPixel from "@/components/marketing/MetaPixel";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { PrecosSection } from "@/components/marketing/landing/PrecosSection";
import { CTASection } from "@/components/marketing/landing/CTASection";
import { Footer } from "@/components/marketing/landing/Footer";

export const metadata = {
  title: "Planos e Preços — Variaty",
  description: "Conheça nossos planos e comece a automatizar seu atendimento no WhatsApp com IA hoje mesmo sem taxas ocultas.",
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
