import Link from "next/link";

export function PricingTeaserSection() {
  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-6">
          Planos desenhados para o seu momento
        </h2>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          Do teste grátis imediato até infraestruturas consultivas de alta escala com White-Label. Descubra a arquitetura ideal para a sua operação.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/precos"
            className="w-full sm:w-auto text-base font-bold bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 transition-all"
          >
            Comparar todos os planos
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto text-base font-bold text-blue-600 bg-blue-50 px-8 py-4 rounded-xl hover:bg-blue-100 transition-all font-medium"
          >
            Criar conta grátis →
          </Link>
        </div>
      </div>
    </section>
  );
}
