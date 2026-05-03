// Clinic Profile API
// GET  /api/clinic/profile  → get clinic profile + booking config for tenant
// POST /api/clinic/profile  → create clinic profile (one per tenant)
// PATCH /api/clinic/profile → update clinic profile and/or booking page config

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils/slugify';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await prisma.clinicProfile.findUnique({
      where: { tenantId: auth.tenantId },
      include: { bookingPageConfig: true },
    });
    return NextResponse.json(profile ?? null);
  } catch (error: any) {
    console.error('[clinic/profile GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // One profile per tenant
    const existing = await prisma.clinicProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um perfil de clínica para este tenant. Use PATCH para atualizar.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { displayName, slug: rawSlug, description, whatsappPhone, address, city, state } = body;

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json({ error: 'displayName é obrigatório.' }, { status: 400 });
    }

    const slug = rawSlug ? slugify(String(rawSlug)) : slugify(displayName);
    if (!slug) {
      return NextResponse.json({ error: 'Slug inválido.' }, { status: 400 });
    }

    // Check slug uniqueness
    const slugConflict = await prisma.clinicProfile.findUnique({ where: { slug } });
    if (slugConflict) {
      return NextResponse.json(
        { error: `O slug "${slug}" já está em uso. Escolha outro.` },
        { status: 409 }
      );
    }

    const profile = await prisma.clinicProfile.create({
      data: {
        tenantId: auth.tenantId, // always from session
        slug,
        displayName: String(displayName),
        description: description ? String(description) : undefined,
        whatsappPhone: whatsappPhone ? String(whatsappPhone) : undefined,
        address: address ? String(address) : undefined,
        city: city ? String(city) : undefined,
        state: state ? String(state) : undefined,
      },
      include: { bookingPageConfig: true },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error: any) {
    console.error('[clinic/profile POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await prisma.clinicProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Perfil de clínica não encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const {
      displayName, description, whatsappPhone, address, city, state, isPublished,
      // Booking page config fields
      heroTitle, heroSubtitle, primaryCtaLabel, showPrices, showProfessionals, showAddress: showAddr,
    } = body;

    const updated = await prisma.clinicProfile.update({
      where: { id: profile.id },
      data: {
        ...(displayName   !== undefined && { displayName: String(displayName) }),
        ...(description   !== undefined && { description: String(description) }),
        ...(whatsappPhone !== undefined && { whatsappPhone: String(whatsappPhone) }),
        ...(address       !== undefined && { address: String(address) }),
        ...(city          !== undefined && { city: String(city) }),
        ...(state         !== undefined && { state: String(state) }),
        ...(isPublished   !== undefined && { isPublished: Boolean(isPublished) }),
      },
    });

    // Optionally upsert booking page config if config fields provided
    const hasConfigFields = [heroTitle, heroSubtitle, primaryCtaLabel, showPrices, showProfessionals, showAddr]
      .some(v => v !== undefined);

    if (hasConfigFields) {
      await prisma.publicBookingPageConfig.upsert({
        where: { clinicProfileId: profile.id },
        update: {
          ...(heroTitle         !== undefined && { heroTitle: String(heroTitle) }),
          ...(heroSubtitle      !== undefined && { heroSubtitle: String(heroSubtitle) }),
          ...(primaryCtaLabel   !== undefined && { primaryCtaLabel: String(primaryCtaLabel) }),
          ...(showPrices        !== undefined && { showPrices: Boolean(showPrices) }),
          ...(showProfessionals !== undefined && { showProfessionals: Boolean(showProfessionals) }),
          ...(showAddr          !== undefined && { showAddress: Boolean(showAddr) }),
        },
        create: {
          tenantId: auth.tenantId,
          clinicProfileId: profile.id,
          heroTitle: heroTitle ? String(heroTitle) : undefined,
          heroSubtitle: heroSubtitle ? String(heroSubtitle) : undefined,
          primaryCtaLabel: primaryCtaLabel ? String(primaryCtaLabel) : undefined,
          showPrices: showPrices !== undefined ? Boolean(showPrices) : true,
          showProfessionals: showProfessionals !== undefined ? Boolean(showProfessionals) : true,
          showAddress: showAddr !== undefined ? Boolean(showAddr) : true,
        },
      });
    }

    const result = await prisma.clinicProfile.findUnique({
      where: { id: profile.id },
      include: { bookingPageConfig: true },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[clinic/profile PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
