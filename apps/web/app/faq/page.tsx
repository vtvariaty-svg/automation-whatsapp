import MetaPixel from "@/components/marketing/MetaPixel";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { FAQSection } from "@/components/marketing/landing/FAQSection";
import { CTASection } from "@/components/marketing/landing/CTASection";
import { Footer } from "@/components/marketing/landing/Footer";

export const metadata = {
  title: "Perguntas Frequentes — Variaty",
  description: "Tire suas dúvidas sobre nossa plataforma de atendimento automatizado no WhatsApp.",
};

export default function FAQPage() {
  return (
    <main className="bg-white min-h-screen selection:bg-blue-200 selection:text-blue-900 font-sans">
      <MetaPixel />
      <Navbar />
      <div className="pt-20">
        <FAQSection />
      </div>
      <CTASection />
      <Footer />
    </main>
  );
}
