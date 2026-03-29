import Link from "next/link";
import Image from "next/image";

const WHATSAPP_DEMO_URL =
  "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20testar%20a%20IA%20da%20Variaty.";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gray-50">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 via-white to-white" />
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#4f46e5] rounded-full mix-blend-multiply filter blur-[128px] opacity-8 animate-pulse" />
      <div
        className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-[#7c3aed] rounded-full mix-blend-multiply filter blur-[128px] opacity-8 animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50/80 border border-blue-200/60 rounded-full px-4 py-1.5 mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-blue-700 uppercase tracking-wide">
              Configuração guiada · API Oficial Meta · Motor OpenAI
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.08] mb-6">
            Atenda, venda e agende 24h
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {" "}no piloto automático
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto font-medium">
            Sua própria Inteligência Artificial conectada ao WhatsApp Oficial. Responde clientes, qualifica leads e fecha vendas em segundos —{" "}<strong className="text-gray-900">sem aumentar sua equipe</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Link
              href="/register"
              className="w-full sm:w-auto text-base font-bold bg-blue-600 text-white px-8 py-4 rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 transition-all hover:-translate-y-1"
            >
              Começar teste grátis
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto text-base font-bold text-gray-700 bg-white border border-gray-200 px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              Ver demonstração →
            </Link>
          </div>

          <div className="flex justify-center mb-5">
            <a
              href={WHATSAPP_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 bg-white border border-gray-200 hover:border-[#25D366]/50 hover:bg-[#f6fef9] rounded-2xl px-5 py-3.5 shadow-sm hover:shadow-md transition-all duration-200 max-w-sm w-full sm:w-auto"
            >
              <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#25D366]" />
                </span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-snug">
                  Ver demo no WhatsApp
                </p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Você conversa com a IA real — responde em segundos
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#25D366] group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Sem cartão de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Sem escrever prompt
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Atendimento ativo em minutos
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Cancele quando quiser
            </span>
          </div>
        </div>

        <div className="mt-16 sm:mt-20 relative max-w-5xl mx-auto w-full px-2 sm:px-0">
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-[#4f46e5]/20 to-[#7c3aed]/20 rounded-3xl blur-xl sm:blur-2xl" />
          <div className="relative bg-gray-900 rounded-2xl shadow-2xl shadow-gray-900/30 overflow-hidden border border-gray-700/80 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
            </div>
            <div className="relative w-full aspect-[16/9] bg-gray-900">
              <Image
                src="/hero-dashboard.png"
                alt="Painel Variaty — Atendimento com IA"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          </div>

          {/* Floating Element 1 - Left */}
          <div className="hidden lg:flex absolute top-10 -left-12 bg-white/95 backdrop-blur shadow-xl border border-gray-100 p-3 rounded-2xl items-center gap-3 animate-bounce shadow-blue-900/5 duration-700" style={{ animationDuration: '3s' }}>
            <div className="bg-green-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">Venda Fechada!</p>
              <p className="text-xs text-gray-500 font-medium">WhatsApp · Há 1 min</p>
            </div>
          </div>

          {/* Floating Element 2 - Right */}
          <div className="hidden lg:flex absolute bottom-20 -right-8 bg-white/95 backdrop-blur shadow-xl border border-gray-100 p-3 rounded-2xl items-center gap-3 animate-bounce shadow-blue-900/5" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">Novo Agendamento</p>
              <p className="text-xs text-gray-500 font-medium">Sincronizado na agenda</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
