export function TestimonialSection() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 bg-[#080d19] overflow-hidden">
      
      {/* Wave Transition Top */}
      <div className="absolute top-0 left-0 right-0 w-full z-0 overflow-hidden pointer-events-none">
        <img 
          src="/landing-v4/backgrounds/wave-mid.svg" 
          alt="" 
          className="w-full min-w-[1440px] h-[60px] md:h-[120px] object-cover object-top" 
        />
      </div>

      {/* Atmospheric Glows */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-8 lg:pt-16">
        
        {/* Strong Social Proof Header */}
        <div className="text-center mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
             Casos Reais de Sucesso
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
            Mais de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">5.000</span> empresas
          </h2>
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            As operações mais modernas do Brasil já usam a Variaty para escalar vendas e automatizar agendamentos 24 horas por dia.
          </p>
        </div>

        {/* Premium Testimonial Card */}
        <div className="relative rounded-[2.5rem] bg-[#0f172a] border border-slate-800 shadow-[0_30px_80px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Side: Testimonial Photo */}
            <div className="relative lg:col-span-5 min-h-[450px] lg:min-h-full bg-gradient-to-b from-slate-800 to-slate-900 flex items-end overflow-hidden group">
               {/* Behind the image glow */}
               <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               
               {/* Responsive Image Crop Strategy */}
               <img 
                 src="/landing-v4/social-proof/testimonial-person.webp" 
                 alt="Cliente Variaty" 
                 className="absolute inset-0 w-full h-full object-cover object-top opacity-95 group-hover:scale-[1.02] transition-transform duration-700"
               />
               
               {/* Elegant Gradient Overlays for smooth blend */}
               <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent h-[60%] mt-auto" />
               <div className="hidden lg:block absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0f172a] to-transparent" />
               
               {/* Plaqueta de Nome */}
               <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 z-10">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30 shrink-0">
                    <svg className="w-6 h-6 text-indigo-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                  </div>
                  <div className="pr-4">
                    <p className="font-bold text-white leading-none mb-1">Diretoria B2B</p>
                    <p className="text-xs text-indigo-300 font-medium uppercase tracking-widest">Tecnologia & Serviços</p>
                  </div>
               </div>
            </div>

            {/* Right Side: Copy & Info */}
            <div className="relative lg:col-span-7 flex flex-col justify-center p-8 sm:p-12 lg:p-16 xl:p-20">
              
              <svg className="w-12 h-12 text-indigo-500/30 mb-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-[1.3] mb-10 text-balance">
                "Desde que implementamos a IA conectada na API oficial, nosso <span className="text-indigo-400">custo de aquisição (CAC) caiu 40%</span>. A máquina qualifica e agenda reuniões nos finais de semana enquanto a equipe descansa."
              </blockquote>

              <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-700/50">
                <div>
                  <p className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">40<span className="text-indigo-500">%</span></p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Redução de CAC</p>
                </div>
                <div>
                  <p className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">3x</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Agendamentos</p>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
