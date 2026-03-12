import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/config/plans';

/**
 * POST /api/admin/seed-plans
 * Seeds the `plans` table with the plan definitions from config.
 * Also links existing subscriptions to their corresponding plan records.
 * Safe to call multiple times (upsert logic).
 */
export async function POST() {
  try {
    const results = [];

    for (const [slug, config] of Object.entries(PLANS)) {
      // Upsert: create plan if not exists, update if it does
      const existing = await prisma.plan.findFirst({
        where: { name: config.name },
      });

      let plan;
      if (existing) {
        plan = await prisma.plan.update({
          where: { id: existing.id },
          data: {
            monthlyAiLimit: config.limitMessages,
            price: config.price,
          },
        });
      } else {
        plan = await prisma.plan.create({
          data: {
            name: config.name,
            monthlyAiLimit: config.limitMessages,
            price: config.price,
          },
        });
      }

      results.push({ slug, planId: plan.id, name: plan.name, limit: plan.monthlyAiLimit });

      // Auto-link: find subscriptions with this plan slug and link the planId
      await prisma.subscription.updateMany({
        where: {
          plan: slug,
          planId: null,
        },
        data: {
          planId: plan.id,
        },
      });
    }

    // Also set currentPeriodStart for subscriptions that don't have it
    await prisma.subscription.updateMany({
      where: { currentPeriodStart: null },
      data: { currentPeriodStart: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Plans seeded and subscriptions linked successfully.',
      plans: results,
    });
  } catch (error: any) {
    console.error('Seed plans error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
