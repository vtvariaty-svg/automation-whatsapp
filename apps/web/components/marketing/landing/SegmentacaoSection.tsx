import Link from "next/link"

const WA_ICON = (
  <svg className="w-4 h-4 fill-[#25D366] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" />
  </svg>
)

const CLINICAS_ITEMS = [
  "Confirmações e lembretes automáticos",
  "Redução de faltas na agenda",
  "Respostas 24h fora do horário",
  "Encaminhamento humano quando necessário",
  "Sem diagnóstico automatizado",
]

const RESTAURANTES_ITEMS = [
  "Respostas automáticas sobre cardápio e preços",
  "Entrada de pedidos organizada pelo WhatsApp",
  "Menos mensagem perdida no horário de pico",
  "Fluxo para delivery ou retirada",
  "Sem processamento de pagamento nesta etapa",
]

export function SegmentacaoSection() {
  return (
    <section className="py-20 lg:py-28 bg-white border-b border-slate-100" aria-labelledby="segmentacao-heading">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-blue-600 font-extrabold tracking-widest text-xs uppercase bg-blue-50 px-3 py-1.5 rounded-md mb-5 ring-1 ring-blue-100">
            Para qual negócio
          </span>
          <h2 id="segmentacao-heading" className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-4">
            Escolha o caminho do seu negócio
          </h2>
          <p className="text-base text-slate-500 font-medium max-w-xl mx-auto">
            A Variaty tem configuração específica para clínicas e para restaurantes. Escolha o que melhor descreve a sua operação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card — Clínicas */}
          <div className="group bg-white rounded-2xl border border-slate-200 p-8 hover:border-teal-200 hover:shadow-[0_8px_30px_rgba(20,184,166,0.08)] transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-6 border border-teal-100">
              <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="inline-flex items-center bg-teal-50 border border-teal-100 rounded-full px-3 py-1 mb-4">
              <span className="text-xs font-extrabold text-teal-600 uppercase tracking-widest">Clínicas · Consultórios · Odontologia</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#0f172a] mb-3 leading-snug">Atendimento administrativo organizado</h3>
            <ul className="space-y-2.5 mb-7" aria-label="O que inclui para clínicas">
              {CLINICAS_ITEMS.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                  <svg className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/clinicas"
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(20,184,166,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
            >
              Ver solução para clínicas
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          {/* Card — Restaurantes */}
          <div className="group bg-white rounded-2xl border border-slate-200 p-8 hover:border-orange-200 hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 border border-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="inline-flex items-center bg-orange-50 border border-orange-100 rounded-full px-3 py-1 mb-4">
              <span className="text-xs font-extrabold text-orange-600 uppercase tracking-widest">Restaurante · Delivery · Marmitaria</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#0f172a] mb-3 leading-snug">Pedidos organizados, atendimento sem caos</h3>
            <ul className="space-y-2.5 mb-7" aria-label="O que inclui para restaurantes">
              {RESTAURANTES_ITEMS.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                  <svg className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/restaurantes"
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(249,115,22,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
            >
              Ver solução para restaurantes
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

        </div>

        <p className="text-center text-sm text-slate-400 font-medium mt-8">
          Outro tipo de negócio?{" "}
          <a
            href="https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20entender%20se%20a%20Variaty%20funciona%20para%20o%20meu%20neg%C3%B3cio."
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            {WA_ICON}
            Fale com a equipe pelo WhatsApp
          </a>
        </p>
      </div>
    </section>
  )
}
