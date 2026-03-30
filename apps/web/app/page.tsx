import MetaPixel from "@/components/marketing/MetaPixel";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { HeroSection } from "@/components/marketing/landing/HeroSection";
import { IntegracoesStrip } from "@/components/marketing/landing/IntegracoesStrip";
import { TeseMercadoSection } from "@/components/marketing/landing/TeseMercadoSection";
import { ComoFuncionaSection } from "@/components/marketing/landing/ComoFuncionaSection";
import { BeneficiosSection } from "@/components/marketing/landing/BeneficiosSection";
import { MecanismoVisualSection } from "@/components/marketing/landing/MecanismoVisualSection";
import { ObjecoesSection } from "@/components/marketing/landing/ObjecoesSection";
import { TestimonialSection } from "@/components/marketing/landing/TestimonialSection";
import { PricingTeaserSection } from "@/components/marketing/landing/PricingTeaserSection";
import { FAQSection } from "@/components/marketing/landing/FAQSection";
import { CTASection } from "@/components/marketing/landing/CTASection";
import { Footer } from "@/components/marketing/landing/Footer";

export const metadata = {
  title: "Variaty — Transforme seu WhatsApp em uma Operação que Atende, Agenda e Vende 24h",
  description:
    "A Variaty conecta IA, automação e controle humano para responder clientes mais rápido, qualificar leads e escalar sua operação no WhatsApp, Instagram e Facebook — sem aumentar o time.",
  openGraph: {
    title: "Variaty — Atendimento com IA para WhatsApp, Instagram e Facebook",
    description:
      "Conecte sua operação ao WhatsApp Oficial, configure sua IA em minutos e escale atendimento, vendas e agendamentos sem precisar aumentar o time.",
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

      {/* 1. Hero de Transformação */}
      <HeroSection />

      {/* 2. Faixa de Confiança Imediata */}
      <IntegracoesStrip />

      {/* 3. Tese de Mercado */}
      <TeseMercadoSection />

      {/* 4. Como Funciona em 3 Passos */}
      <ComoFuncionaSection />

      {/* 5. Benefícios de Negócio */}
      <BeneficiosSection />

      {/* 6. Mecanismo Visual do Produto */}
      <MecanismoVisualSection />

      {/* 7. Objeções Derrubadas */}
      <ObjecoesSection />

      {/* 8. Testemunho / Prova Social Humana */}
      <TestimonialSection />

      {/* 9. Teaser de Planos */}
      <PricingTeaserSection />

      {/* 10. FAQ Curto */}
      <FAQSection />

      {/* 11. CTA Final */}
      <CTASection />

      <Footer />
    </main>
  );
}
