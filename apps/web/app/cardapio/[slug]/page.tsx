import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicRestaurantBySlug } from '@/lib/public/restaurant';
import { RestaurantOrderForm } from './RestaurantOrderForm';

function waLink(phone: string, message: string) {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getPublicRestaurantBySlug(slug);
  if (!restaurant) return { title: 'Cardápio não encontrado' };
  return {
    title: `${restaurant.displayName} | Cardápio pelo WhatsApp`,
    description: restaurant.description ?? `Veja o cardápio de ${restaurant.displayName} e faça seu pedido pelo WhatsApp.`,
  };
}

export default async function CardapioPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const restaurant = await getPublicRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const cfg = restaurant.menuPageConfig;
  const phone = restaurant.whatsappPhone ?? '';
  const showDelivery = cfg?.showDeliveryInfo ?? true;
  const showPickup = cfg?.showPickupInfo ?? true;
  const ctaLabel = cfg?.primaryCtaLabel ?? 'Fazer pedido pelo WhatsApp';
  const heroTitle = cfg?.heroTitle ?? restaurant.displayName;
  const heroSubtitle = cfg?.heroSubtitle ?? 'Peça agora pelo WhatsApp. Rápido e sem complicação.';

  const generalMsg = `Olá, vim pelo cardápio da ${restaurant.displayName} e gostaria de fazer um pedido.`;
  const location = [restaurant.address, restaurant.city, restaurant.state].filter(Boolean).join(', ');

  const hasProducts = restaurant.categories.some(c => c.products.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-extrabold leading-tight">{heroTitle}</h1>
          <p className="mt-3 text-orange-100 text-base">{heroSubtitle}</p>

          {/* Delivery/Pickup info */}
          {(showDelivery || showPickup) && (restaurant.acceptsDelivery || restaurant.acceptsPickup) && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
              {showDelivery && restaurant.acceptsDelivery && (
                <span className="bg-orange-400/40 px-3 py-1 rounded-full text-orange-50">🛵 Delivery</span>
              )}
              {showPickup && restaurant.acceptsPickup && (
                <span className="bg-orange-400/40 px-3 py-1 rounded-full text-orange-50">🏃 Retirada</span>
              )}
            </div>
          )}

          {location && (
            <p className="mt-3 text-sm text-orange-200">📍 {location}</p>
          )}

          {phone && (
            <a
              href={waLink(phone, generalMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 bg-white text-orange-600 font-bold text-sm px-6 py-3 rounded-full shadow hover:shadow-md transition-all"
            >
              <WhatsAppIcon />
              {ctaLabel}
            </a>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Delivery info bar */}
        {showDelivery && (restaurant.deliveryFeeDescription || restaurant.minimumOrderValue) && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-sm text-orange-700">
            {restaurant.deliveryFeeDescription && (
              <span>🛵 {restaurant.deliveryFeeDescription}</span>
            )}
            {restaurant.minimumOrderValue && restaurant.minimumOrderValue > 0 && (
              <span>🧾 Pedido mínimo: {fmt(restaurant.minimumOrderValue)}</span>
            )}
          </div>
        )}

        {/* Menu */}
        {!hasProducts ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-3xl mb-2">🍽️</p>
            <p className="text-sm text-gray-500">O cardápio ainda está sendo configurado.</p>
            {phone && (
              <a
                href={waLink(phone, generalMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-orange-600 transition-colors"
              >
                <WhatsAppIcon />
                Entrar em contato
              </a>
            )}
          </div>
        ) : (
          restaurant.categories.map(cat => {
            if (cat.products.length === 0) return null;
            return (
              <section key={cat.id}>
                <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">{cat.name}</h2>
                {cat.description && <p className="text-xs text-gray-500 -mt-2 mb-3">{cat.description}</p>}
                <div className="grid gap-3">
                  {cat.products.map(product => {
                    const msg = `Olá, vim pelo cardápio da ${restaurant.displayName} e tenho interesse em pedir: ${product.name}.`;
                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex gap-3 ${!product.isAvailable ? 'opacity-60' : ''}`}
                      >
                        {product.imageUrl && (
                          <div className="w-24 h-24 shrink-0 bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</p>
                              {!product.isAvailable && (
                                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Indisponível</span>
                              )}
                            </div>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-orange-600 text-sm">{fmt(product.price)}</span>
                            {phone && product.isAvailable && (
                              <a
                                href={waLink(phone, msg)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-orange-100 transition-colors"
                              >
                                <WhatsAppIcon size={13} />
                                Pedir
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {/* Order form */}
        <section>
          <RestaurantOrderForm
            slug={slug}
            restaurantName={restaurant.displayName}
            whatsappPhone={phone}
            acceptsDelivery={restaurant.acceptsDelivery}
            acceptsPickup={restaurant.acceptsPickup}
            categories={restaurant.categories}
          />
        </section>

        {/* CTA bottom — WhatsApp direto sem formulário */}
        {phone && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-orange-800 mb-1">Prefere falar direto pelo WhatsApp?</p>
            <p className="text-xs text-orange-600 mb-3">Sem preencher formulário</p>
            <a
              href={waLink(phone, generalMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold text-sm px-6 py-3 rounded-full shadow hover:bg-orange-600 transition-colors"
            >
              <WhatsAppIcon />
              {ctaLabel}
            </a>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Pagamento online não é processado nesta etapa. O restaurante confirma pedido, entrega/retirada e pagamento pelo WhatsApp.
        </p>
      </div>
    </div>
  );
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.115 1.527 5.845L.057 23.49a.75.75 0 0 0 .921.921l5.729-1.491A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.714 9.714 0 0 1-4.958-1.357l-.355-.212-3.659.953.975-3.562-.232-.368A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
    </svg>
  );
}
