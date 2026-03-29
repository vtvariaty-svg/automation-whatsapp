import MetaPixel from "@/components/marketing/MetaPixel";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { Footer } from "@/components/marketing/landing/Footer";

export const metadata = {
  title: "Fale Conosco — Variaty",
  description: "Entre em contato com nossa equipe comercial e tire todas as suas dúvidas.",
};

export default function ContatoPage() {
  return (
    <main className="bg-white min-h-screen flex flex-col selection:bg-blue-200 selection:text-blue-900 font-sans">
      <MetaPixel />
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full pt-40 pb-24 px-4 sm:px-6 mt-6">
        <div className="text-center mb-12">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Contato
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Fale Conosco</h1>
          <p className="text-lg text-gray-600">A equipe da Variaty está pronta para ajudar o seu negócio.</p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
          
          <div className="space-y-8 max-w-md mx-auto relative z-10">
            {/* WhatsApp */}
            <div className="flex gap-4 items-center group">
              <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0 border border-[#25D366]/20 transition-all group-hover:bg-[#25D366] group-hover:text-white">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">WhatsApp Comercial</p>
                <a href="https://wa.me/5519995993220" target="_blank" rel="noopener noreferrer" className="text-gray-900 font-extrabold text-xl transition-colors group-hover:text-[#25D366]">
                  (19) 99599-3220
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-4 items-center group">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20 transition-all group-hover:bg-blue-500 group-hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">E-mail Comercial</p>
                <a href="mailto:comercial@vtvariatysecretary.com.br" className="text-gray-900 font-extrabold text-lg md:text-xl transition-colors group-hover:text-blue-500 break-all">
                  comercial@vtvariatysecretary.com.br
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
