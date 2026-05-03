import { prisma } from '@/lib/prisma';

export async function getPublicClinicBySlug(slug: string) {
  const profile = await prisma.clinicProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      displayName: true,
      description: true,
      whatsappPhone: true,
      address: true,
      city: true,
      state: true,
      isPublished: true,
      bookingPageConfig: {
        select: {
          heroTitle: true,
          heroSubtitle: true,
          primaryCtaLabel: true,
          showPrices: true,
          showProfessionals: true,
          showAddress: true,
        },
      },
      services: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          durationMinutes: true,
          priceDescription: true,
        },
      },
      professionals: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          role: true,
          bio: true,
        },
      },
      availability: {
        where: { isActive: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          professionalId: true,
        },
      },
    },
  });

  if (!profile || !profile.isPublished) return null;
  return profile;
}

export type PublicClinic = Awaited<ReturnType<typeof getPublicClinicBySlug>>;
