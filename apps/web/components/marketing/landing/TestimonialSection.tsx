export function TestimonialSection() {
  return (
    <section className="py-24 bg-white border-y border-gray-100 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/10">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Left Side: Testimonial Photo Fallback to shape if not found */}
            <div className="relative h-64 sm:h-80 lg:h-auto bg-gray-800">
               <img 
                 src="/landing-v4/social-proof/testimonial-person.webp" 
                 onError={(e) => { e.currentTarget.style.display='none'; }}
                 alt="Cliente Variaty" 
                 className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
               />
               <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-gray-900 via-gray-900/40 to-transparent lg:w-full lg:h-full w-full h-1/2 bottom-0" />
            </div>

            {/* Right Side: Copy & Info */}
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <svg className="w-10 h-10 text-blue-500 mb-6 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-8">
                "Desde que implementamos a IA conectada na API oficial, nosso custo de aquisição (CAC) caiu 40%. A máquina qualifica e agenda reuniões nos finais de semana enquanto a equipe descansa."
              </blockquote>

              <div>
                <p className="text-white font-bold text-lg">Diretor de Operações B2B</p>
                <p className="text-blue-400 font-medium text-sm mt-1 uppercase tracking-wide">Tecnologia & Serviços</p>
              </div>

              <div className="mt-8 flex items-center gap-6 border-t border-gray-800 pt-8">
                <div>
                  <p className="text-4xl font-extrabold text-white">40<span className="text-blue-500">%</span></p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Redução de CAC</p>
                </div>
                <div className="w-px h-12 bg-gray-800" />
                <div>
                  <p className="text-4xl font-extrabold text-white">3x</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Agendamentos</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
