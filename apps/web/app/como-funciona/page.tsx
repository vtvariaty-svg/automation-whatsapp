import MetaPixel from "@/components/marketing/MetaPixel";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { MecanismoSection } from "@/components/marketing/landing/MecanismoSection";
import { AtivacaoSection } from "@/components/marketing/landing/AtivacaoSection";
import { CTASection } from "@/components/marketing/landing/CTASection";
import { Footer } from "@/components/marketing/landing/Footer";

export const metadata = {
  title: "Como Funciona a Variaty — IA para Relacionamento",
  description: "Entenda detalhadamente como a Variaty opera, conecta seus canais e qualifica seus leads automaticamente no WhatsApp.",
};

export default function ComoFuncionaPage() {
  return (
    <main className="bg-white min-h-screen selection:bg-blue-200 selection:text-blue-900 font-sans">
      <MetaPixel />
      <Navbar />
      <div className="pt-20">
        <MecanismoSection />
        <AtivacaoSection />
      </div>
      <CTASection />
      <Footer />
    </main>
  );
}
