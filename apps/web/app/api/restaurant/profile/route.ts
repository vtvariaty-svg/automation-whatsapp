// Restaurant Profile API
// GET   /api/restaurant/profile  → get restaurant profile + menu config
// POST  /api/restaurant/profile  → create profile (one per tenant)
// PATCH /api/restaurant/profile  → update profile and/or menu page config

import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/verticalAccess';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils/slugify';

export async function GET(request: Request) {
  const access = await requireRestaurantAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  try {
    const profile = await prisma.restaurantProfile.findUnique({
      where: { tenantId: auth.tenantId },
      include: { menuPageConfig: true },
    });
    return NextResponse.json(profile ?? null);
  } catch (error: any) {
    console.error('[restaurant/profile GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireRestaurantAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  try {
    const existing = await prisma.restaurantProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um perfil de restaurante para este tenant. Use PATCH para atualizar.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const {
      displayName, slug: rawSlug, description, whatsappPhone,
      address, city, state, acceptsDelivery, acceptsPickup,
      deliveryFeeDescription, minimumOrderValue,
    } = body;

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json({ error: 'displayName é obrigatório.' }, { status: 400 });
    }

    const slug = rawSlug ? slugify(String(rawSlug)) : slugify(displayName);
    if (!slug) {
      return NextResponse.json({ error: 'Slug inválido.' }, { status: 400 });
    }

    const slugConflict = await prisma.restaurantProfile.findUnique({ where: { slug } });
    if (slugConflict) {
      return NextResponse.json(
        { error: `O slug "${slug}" já está em uso. Escolha outro.` },
        { status: 409 }
      );
    }

    const minOrderVal =
      minimumOrderValue !== undefined && minimumOrderValue !== null
        ? Number(minimumOrderValue)
        : undefined;

    if (minOrderVal !== undefined && (isNaN(minOrderVal) || minOrderVal < 0)) {
      return NextResponse.json({ error: 'minimumOrderValue deve ser um número >= 0.' }, { status: 400 });
    }

    const profile = await prisma.restaurantProfile.create({
      data: {
        tenantId: auth.tenantId,
        slug,
        displayName: String(displayName),
        description: description ? String(description) : undefined,
        whatsappPhone: whatsappPhone ? String(whatsappPhone) : undefined,
        address: address ? String(address) : undefined,
        city: city ? String(city) : undefined,
        state: state ? String(state) : undefined,
        acceptsDelivery: acceptsDelivery !== undefined ? Boolean(acceptsDelivery) : true,
        acceptsPickup: acceptsPickup !== undefined ? Boolean(acceptsPickup) : true,
        deliveryFeeDescription: deliveryFeeDescription ? String(deliveryFeeDescription) : undefined,
        minimumOrderValue: minOrderVal,
      },
      include: { menuPageConfig: true },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error: any) {
    console.error('[restaurant/profile POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const access = await requireRestaurantAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  try {
    const profile = await prisma.restaurantProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Perfil de restaurante não encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const {
      displayName, description, whatsappPhone, address, city, state,
      acceptsDelivery, acceptsPickup, deliveryFeeDescription, minimumOrderValue, isPublished,
      // Menu page config fields
      heroTitle, heroSubtitle, primaryCtaLabel, showDeliveryInfo, showPickupInfo,
    } = body;

    const minOrderVal =
      minimumOrderValue !== undefined && minimumOrderValue !== null
        ? Number(minimumOrderValue)
        : undefined;

    if (minOrderVal !== undefined && (isNaN(minOrderVal) || minOrderVal < 0)) {
      return NextResponse.json({ error: 'minimumOrderValue deve ser um número >= 0.' }, { status: 400 });
    }

    await prisma.restaurantProfile.update({
      where: { id: profile.id },
      data: {
        ...(displayName            !== undefined && { displayName: String(displayName) }),
        ...(description            !== undefined && { description: String(description) }),
        ...(whatsappPhone          !== undefined && { whatsappPhone: String(whatsappPhone) }),
        ...(address                !== undefined && { address: String(address) }),
        ...(city                   !== undefined && { city: String(city) }),
        ...(state                  !== undefined && { state: String(state) }),
        ...(acceptsDelivery        !== undefined && { acceptsDelivery: Boolean(acceptsDelivery) }),
        ...(acceptsPickup          !== undefined && { acceptsPickup: Boolean(acceptsPickup) }),
        ...(deliveryFeeDescription !== undefined && { deliveryFeeDescription: String(deliveryFeeDescription) }),
        ...(minOrderVal            !== undefined && { minimumOrderValue: minOrderVal }),
        ...(isPublished            !== undefined && { isPublished: Boolean(isPublished) }),
      },
    });

    const hasConfigFields = [heroTitle, heroSubtitle, primaryCtaLabel, showDeliveryInfo, showPickupInfo]
      .some(v => v !== undefined);

    if (hasConfigFields) {
      await prisma.publicMenuPageConfig.upsert({
        where: { restaurantProfileId: profile.id },
        update: {
          ...(heroTitle        !== undefined && { heroTitle: String(heroTitle) }),
          ...(heroSubtitle     !== undefined && { heroSubtitle: String(heroSubtitle) }),
          ...(primaryCtaLabel  !== undefined && { primaryCtaLabel: String(primaryCtaLabel) }),
          ...(showDeliveryInfo !== undefined && { showDeliveryInfo: Boolean(showDeliveryInfo) }),
          ...(showPickupInfo   !== undefined && { showPickupInfo: Boolean(showPickupInfo) }),
        },
        create: {
          tenantId: auth.tenantId,
          restaurantProfileId: profile.id,
          heroTitle: heroTitle ? String(heroTitle) : undefined,
          heroSubtitle: heroSubtitle ? String(heroSubtitle) : undefined,
          primaryCtaLabel: primaryCtaLabel ? String(primaryCtaLabel) : undefined,
          showDeliveryInfo: showDeliveryInfo !== undefined ? Boolean(showDeliveryInfo) : true,
          showPickupInfo: showPickupInfo !== undefined ? Boolean(showPickupInfo) : true,
        },
      });
    }

    const result = await prisma.restaurantProfile.findUnique({
      where: { id: profile.id },
      include: { menuPageConfig: true },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[restaurant/profile PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
