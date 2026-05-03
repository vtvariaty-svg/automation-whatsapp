import { prisma } from '@/lib/prisma';

export async function getPublicRestaurantBySlug(slug: string) {
  const profile = await prisma.restaurantProfile.findUnique({
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
      acceptsDelivery: true,
      acceptsPickup: true,
      deliveryFeeDescription: true,
      minimumOrderValue: true,
      isPublished: true,
      menuPageConfig: {
        select: {
          heroTitle: true,
          heroSubtitle: true,
          primaryCtaLabel: true,
          showDeliveryInfo: true,
          showPickupInfo: true,
        },
      },
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          products: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
              isAvailable: true,
            },
          },
        },
      },
    },
  });

  if (!profile || !profile.isPublished) return null;
  return profile;
}

export type PublicRestaurant = Awaited<ReturnType<typeof getPublicRestaurantBySlug>>;
