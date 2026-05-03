import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicClinicBySlug } from '@/lib/public/clinic';
import { AppointmentRequestForm } from './AppointmentRequestForm';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function waLink(phone: string, message: string) {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const clinic = await getPublicClinicBySlug(slug);
  if (!clinic) return { title: 'Clínica não encontrada' };
  return {
    title: `${clinic.displayName} | Agendamento pelo WhatsApp`,
    description: clinic.description ?? `Agende seu atendimento em ${clinic.displayName} pelo WhatsApp.`,
  };
}

export default async function AgendarPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const clinic = await getPublicClinicBySlug(slug);
  if (!clinic) notFound();

  const cfg = clinic.bookingPageConfig;
  const phone = clinic.whatsappPhone ?? '';
  const showPrices = cfg?.showPrices ?? true;
  const showProfessionals = cfg?.showProfessionals ?? true;
  const showAddress = cfg?.showAddress ?? true;
  const ctaLabel = cfg?.primaryCtaLabel ?? 'Solicitar agendamento pelo WhatsApp';
  const heroTitle = cfg?.heroTitle ?? `Agende em ${clinic.displayName}`;
  const heroSubtitle = cfg?.heroSubtitle ?? 'Atendimento pelo WhatsApp. Rápido e sem complicação.';

  const generalMsg = `Olá, vim pela página da ${clinic.displayName} e gostaria de solicitar um agendamento.`;

  const location = [clinic.address, clinic.city, clinic.state].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-extrabold leading-tight">{heroTitle}</h1>
          <p className="mt-3 text-teal-100 text-base">{heroSubtitle}</p>
          {showAddress && location && (
            <p className="mt-4 text-sm text-teal-200">📍 {location}</p>
          )}
          {phone && (
            <a
              href={waLink(phone, generalMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 bg-white text-teal-700 font-bold text-sm px-6 py-3 rounded-full shadow hover:shadow-md transition-all"
            >
              <WhatsAppIcon />
              {ctaLabel}
            </a>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Services */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Serviços</h2>
          {clinic.services.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Nenhum serviço cadastrado ainda.</p>
          ) : (
            <div className="grid gap-3">
              {clinic.services.map(svc => {
                const msg = `Olá, vim pela página da ${clinic.displayName} e gostaria de solicitar agendamento para: ${svc.name}.`;
                return (
                  <div key={svc.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{svc.name}</p>
                      {svc.description && <p className="text-xs text-gray-500 mt-0.5">{svc.description}</p>}
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        {svc.durationMinutes && <span>⏱ {svc.durationMinutes} min</span>}
                        {showPrices && svc.priceDescription && <span>💰 {svc.priceDescription}</span>}
                      </div>
                    </div>
                    {phone && (
                      <a
                        href={waLink(phone, msg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-teal-100 transition-colors"
                      >
                        <WhatsAppIcon size={14} />
                        Agendar
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Professionals */}
        {showProfessionals && clinic.professionals.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Profissionais</h2>
            <div className="grid gap-3">
              {clinic.professionals.map(prof => (
                <div key={prof.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold text-gray-900 text-sm">{prof.name}</p>
                  {prof.role && <p className="text-xs text-teal-600 mt-0.5">{prof.role}</p>}
                  {prof.bio && <p className="text-xs text-gray-500 mt-1">{prof.bio}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Availability */}
        {clinic.availability.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Horários de Atendimento</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {clinic.availability.map(av => (
                <div key={av.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium text-gray-700">{DAY_NAMES[av.dayOfWeek]}</span>
                  <span className="text-gray-500">{av.startTime} – {av.endTime}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Appointment request form */}
        <section>
          <AppointmentRequestForm
            slug={slug}
            clinicName={clinic.displayName}
            whatsappPhone={phone}
            services={clinic.services}
            professionals={clinic.professionals}
            showProfessionals={showProfessionals}
          />
        </section>

        {/* CTA bottom */}
        {phone && (
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-teal-800 mb-3">Prefere ir direto pelo WhatsApp?</p>
            <a
              href={waLink(phone, generalMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-teal-600 text-white font-bold text-sm px-6 py-3 rounded-full shadow hover:bg-teal-700 transition-colors"
            >
              <WhatsAppIcon />
              {ctaLabel}
            </a>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Esta página é para solicitação administrativa de atendimento. A IA não realiza diagnóstico, prescrição ou interpretação de exames.
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
