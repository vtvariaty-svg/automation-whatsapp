/**
 * GET /api/attribution/report?period=7days|30days|all
 * Tenant admin (own data) or superadmin (any tenant via ?tenantId=)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { subDays, startOfDay } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SourceRow {
  source: string;
  leads: number;
  converted: number;
  conversionRate: number;
  revenue: number;
}

interface MediumRow {
  medium: string;
  leads: number;
  converted: number;
  revenue: number;
}

interface CampaignRow {
  campaign: string;
  leads: number;
  converted: number;
  revenue: number;
}

interface TouchRow {
  source: string;
  count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodStart(period: string): Date | null {
  if (period === '7days') return startOfDay(subDays(new Date(), 7));
  if (period === '30days') return startOfDay(subDays(new Date(), 30));
  return null; // 'all'
}

function sumRevenue(items: { revenueAmount: number | null }[]): number {
  return items.reduce((acc, r) => acc + (r.revenueAmount ?? 0), 0);
}

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'all';
  const queryTenantId = searchParams.get('tenantId');

  // superadmin can query any tenant; regular users query own tenant
  let tenantId = auth.tenantId;
  if (queryTenantId) {
    if (auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    tenantId = queryTenantId;
  }

  const periodStart = getPeriodStart(period);
  const where = {
    tenantId,
    ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
  };

  const records = await prisma.leadAttribution.findMany({ where });

  // ── Summary ──────────────────────────────────────────────────────────────
  const totalLeads = records.length;
  const converted = records.filter((r) => r.converted);
  const totalConverted = converted.length;
  const conversionRate =
    totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 10000) / 100 : 0;
  const totalRevenue = sumRevenue(converted);

  // ── By source ─────────────────────────────────────────────────────────────
  const sourceMap = new Map<string, { leads: number; converted: number; revenue: number }>();
  for (const r of records) {
    const src = r.lastSource ?? 'unknown';
    const existing = sourceMap.get(src) ?? { leads: 0, converted: 0, revenue: 0 };
    existing.leads += 1;
    if (r.converted) {
      existing.converted += 1;
      existing.revenue += r.revenueAmount ?? 0;
    }
    sourceMap.set(src, existing);
  }
  const bySource: SourceRow[] = Array.from(sourceMap.entries())
    .map(([source, d]) => ({
      source,
      leads: d.leads,
      converted: d.converted,
      conversionRate: d.leads > 0 ? Math.round((d.converted / d.leads) * 10000) / 100 : 0,
      revenue: d.revenue,
    }))
    .sort((a, b) => b.leads - a.leads);

  // ── By medium ─────────────────────────────────────────────────────────────
  const mediumMap = new Map<string, { leads: number; converted: number; revenue: number }>();
  for (const r of records) {
    const med = r.lastMedium ?? 'unknown';
    const existing = mediumMap.get(med) ?? { leads: 0, converted: 0, revenue: 0 };
    existing.leads += 1;
    if (r.converted) {
      existing.converted += 1;
      existing.revenue += r.revenueAmount ?? 0;
    }
    mediumMap.set(med, existing);
  }
  const byMedium: MediumRow[] = Array.from(mediumMap.entries())
    .map(([medium, d]) => ({ medium, leads: d.leads, converted: d.converted, revenue: d.revenue }))
    .sort((a, b) => b.leads - a.leads);

  // ── By campaign (non-null only) ───────────────────────────────────────────
  const campaignMap = new Map<string, { leads: number; converted: number; revenue: number }>();
  for (const r of records) {
    if (!r.lastCampaign) continue;
    const existing = campaignMap.get(r.lastCampaign) ?? { leads: 0, converted: 0, revenue: 0 };
    existing.leads += 1;
    if (r.converted) {
      existing.converted += 1;
      existing.revenue += r.revenueAmount ?? 0;
    }
    campaignMap.set(r.lastCampaign, existing);
  }
  const byCampaign: CampaignRow[] = Array.from(campaignMap.entries())
    .map(([campaign, d]) => ({
      campaign,
      leads: d.leads,
      converted: d.converted,
      revenue: d.revenue,
    }))
    .sort((a, b) => b.leads - a.leads);

  // ── First touch (by firstSource) ─────────────────────────────────────────
  const firstTouchMap = new Map<string, number>();
  for (const r of records) {
    const src = r.firstSource ?? 'unknown';
    firstTouchMap.set(src, (firstTouchMap.get(src) ?? 0) + 1);
  }
  const firstTouch: TouchRow[] = Array.from(firstTouchMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // ── Last touch (by lastSource among converted) ────────────────────────────
  const lastTouchMap = new Map<string, number>();
  for (const r of converted) {
    const src = r.lastSource ?? 'unknown';
    lastTouchMap.set(src, (lastTouchMap.get(src) ?? 0) + 1);
  }
  const lastTouch: TouchRow[] = Array.from(lastTouchMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return NextResponse.json({
    period,
    summary: { totalLeads, totalConverted, conversionRate, totalRevenue },
    bySource,
    byMedium,
    byCampaign,
    firstTouch,
    lastTouch,
  });
}
