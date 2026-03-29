import MetaPixel from "@/components/marketing/MetaPixel";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { HeroSection } from "@/components/marketing/landing/HeroSection";
import { IntegracoesStrip } from "@/components/marketing/landing/IntegracoesStrip";
import { CredibilidadeStrip } from "@/components/marketing/landing/CredibilidadeStrip";
import { ComoFuncionaSection } from "@/components/marketing/landing/ComoFuncionaSection";
import { BeneficiosSection } from "@/components/marketing/landing/BeneficiosSection";
import { PricingTeaserSection } from "@/components/marketing/landing/PricingTeaserSection";
import { TestimonialSection } from "@/components/marketing/landing/TestimonialSection";
import { FAQSection } from "@/components/marketing/landing/FAQSection";
import { CTASection } from "@/components/marketing/landing/CTASection";
import { Footer } from "@/components/marketing/landing/Footer";

export const metadata = {
  title: "Variaty — Atendimento no WhatsApp com IA que Vende e Agenda 24h",
  description:
    "Automatize o atendimento no WhatsApp, Instagram e Facebook com IA. Qualifique leads, feche vendas e gerencie agendamentos — 24 horas por dia, sem aumentar o time.",
  openGraph: {
    title: "Variaty — Atendimento com IA para WhatsApp, Instagram e Facebook",
    description:
      "Configure sua IA de atendimento em minutos. Venda, agende e qualifique clientes automaticamente — conectado à API Oficial da Meta.",
    url: "https://vtvariatysecretary.com.br",
    siteName: "Variaty",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <main className="bg-white min-h-screen selection:bg-indigo-200 selection:text-indigo-900 font-sans">
      <MetaPixel />
      <Navbar />
      <HeroSection />
      <IntegracoesStrip />
      <CredibilidadeStrip />
      <ComoFuncionaSection />
      <BeneficiosSection />
      <TestimonialSection />
      <PricingTeaserSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
