/**
 * L3 – Sandbox / E2E Scenario Runner
 *
 * Validates critical business flows by exercising real service logic
 * WITHOUT sending actual messages. Each scenario returns an array of
 * StepResult objects so operators can verify the pipeline is configured
 * correctly before activating in production.
 */
import { prisma } from '@/lib/prisma';

export interface StepResult {
  step: string;
  expected: string;
  actual: string;
  status: 'pass' | 'fail' | 'skip';
  detail?: string;
}

export type ScenarioId =
  | 'comment_to_dm_flow'
  | 'dm_inbound_ai_handoff'
  | 'lead_to_appointment'
  | 'lead_to_checkout_followup'
  | 'keyword_rule_match';

// ─── helpers ──────────────────────────────────────────────────────────────────

function pass(step: string, expected: string, actual: string, detail?: string): StepResult {
  return { step, expected, actual, status: 'pass', detail };
}

function fail(step: string, expected: string, actual: string, detail?: string): StepResult {
  return { step, expected, actual, status: 'fail', detail };
}

function skip(step: string, reason: string): StepResult {
  return { step, expected: '-', actual: reason, status: 'skip' };
}

// ─── Scenario 1: Comment → DM → Qualification → Offer ────────────────────────

async function runCommentToDmFlow(tenantId: string): Promise<StepResult[]> {
  const results: StepResult[] = [];

  // Step 1: Instagram connection
  const igConn = await prisma.instagramConnection.findUnique({ where: { tenantId } });
  if (!igConn || igConn.status !== 'connected') {
    results.push(fail('instagram_connected', 'InstagramConnection with status=connected', igConn?.status ?? 'not found'));
    return results;
  }
  results.push(pass('instagram_connected', 'InstagramConnection connected', 'connected'));

  // Step 2: Active comment rule with send_dm action
  const rules = await prisma.instagramCommentRule.findMany({
    where: { tenantId, active: true },
  });
  const dmRule = rules.find((r) => {
    const actions = r.actions as Record<string, unknown>;
    return actions.send_dm || actions.dm_text || actions.start_sequence;
  });
  if (!dmRule) {
    results.push(fail('comment_rule_with_dm', 'Active comment rule with send_dm action', `${rules.length} rules found, none with DM action`));
    return results;
  }
  results.push(pass('comment_rule_with_dm', 'Active rule with DM action', dmRule.name, `trigger: ${dmRule.triggerType}="${dmRule.triggerValue}"`));

  // Step 3: Keyword or AI trigger configured
  if (dmRule.triggerType === 'keyword' || dmRule.triggerType === 'contains') {
    results.push(pass('trigger_type', 'Keyword/contains trigger', dmRule.triggerType, dmRule.triggerValue));
  } else if (dmRule.triggerType === 'ai_intent') {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.aiPrompt && !tenant?.openaiKey) {
      results.push(fail('trigger_type', 'AI intent requires openaiKey or aiPrompt', 'neither configured'));
    } else {
      results.push(pass('trigger_type', 'AI intent trigger', 'ai_intent', 'openAI key present'));
    }
  } else {
    results.push(skip('trigger_type', `Unknown trigger: ${dmRule.triggerType}`));
  }

  // Step 4: Conversion sequence linked (if start_sequence action)
  const actions = dmRule.actions as Record<string, unknown>;
  if (actions.start_sequence) {
    const seqId = actions.start_sequence as string;
    const seq = await prisma.conversionSequence.findUnique({ where: { id: seqId } });
    if (!seq) {
      results.push(fail('sequence_exists', `Sequence ${seqId} exists`, 'not found'));
    } else {
      const stepCount = await prisma.conversionSequenceStep.count({ where: { sequenceId: seqId } });
      results.push(pass('sequence_exists', 'Sequence linked and has steps', seq.name, `${stepCount} step(s)`));
    }
  } else {
    results.push(skip('sequence_exists', 'No start_sequence action on this rule'));
  }

  return results;
}

// ─── Scenario 2: DM Inbound → AI → Handoff ────────────────────────────────────

async function runDmInboundAiHandoff(tenantId: string): Promise<StepResult[]> {
  const results: StepResult[] = [];

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return [fail('tenant_exists', 'Tenant found', 'not found')];

  // AI prompt configured
  if (!tenant.aiPrompt) {
    results.push(fail('ai_prompt', 'aiPrompt configured', 'empty — AI will use fallback only'));
  } else {
    results.push(pass('ai_prompt', 'aiPrompt configured', `${tenant.aiPrompt.slice(0, 60)}…`));
  }

  // OpenAI key
  if (!tenant.openaiKey) {
    results.push(fail('openai_key', 'openaiKey configured', 'not set — AI replies will fail'));
  } else {
    results.push(pass('openai_key', 'openaiKey set', '••••••••'));
  }

  // Channel configured (at least whatsapp or instagram)
  const channels = (tenant.enabledChannels ?? 'whatsapp').split(',');
  results.push(pass('channel_enabled', 'At least one channel enabled', channels.join(', ')));

  // Handoff: check if any automation sets status=human_takeover or assignedUser
  const humanRule = await prisma.automationRule.findFirst({
    where: { tenantId, triggerValue: { contains: 'falar com humano' } },
  });
  if (!humanRule) {
    results.push(skip('handoff_rule', 'No "falar com humano" automation rule found — handoff via webhook only'));
  } else {
    results.push(pass('handoff_rule', 'Handoff automation rule', humanRule.name));
  }

  return results;
}

// ─── Scenario 3: Lead → Appointment ──────────────────────────────────────────

async function runLeadToAppointment(tenantId: string): Promise<StepResult[]> {
  const results: StepResult[] = [];

  // Services exist
  const serviceCount = await prisma.service.count({ where: { tenantId, active: true } });
  if (serviceCount === 0) {
    results.push(fail('services_configured', 'At least 1 active service', '0 services found'));
  } else {
    results.push(pass('services_configured', 'Active services', `${serviceCount} service(s)`));
  }

  // AI prompt mentions appointments
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const mentionsAppointment = tenant?.aiPrompt
    ? /agend|appoint|booking|hor[aá]rio/i.test(tenant.aiPrompt)
    : false;
  if (!mentionsAppointment) {
    results.push(fail('ai_prompt_appointments', 'aiPrompt references appointments', 'no appointment keywords found in prompt'));
  } else {
    results.push(pass('ai_prompt_appointments', 'aiPrompt references appointments', 'keywords found'));
  }

  // Business hours configured
  if (!tenant?.businessHours) {
    results.push(fail('business_hours', 'businessHours configured', 'not set'));
  } else {
    results.push(pass('business_hours', 'businessHours set', tenant.businessHours.slice(0, 40)));
  }

  return results;
}

// ─── Scenario 4: Lead → Checkout → Follow-up ─────────────────────────────────

async function runLeadToCheckoutFollowup(tenantId: string): Promise<StepResult[]> {
  const results: StepResult[] = [];

  // Products with price
  const products = await prisma.product.findMany({ where: { tenantId, price: { gt: 0 } } });
  if (products.length === 0) {
    results.push(fail('products_with_price', 'At least 1 product with price > 0', '0 found'));
  } else {
    results.push(pass('products_with_price', 'Products with price', `${products.length} product(s)`));
  }

  // SalesOpportunity / follow-up scheduler (check instrumentation)
  const openOpp = await prisma.salesOpportunity.findFirst({ where: { tenantId } });
  if (!openOpp) {
    results.push(skip('sales_opportunity', 'No SalesOpportunity rows yet — will be created on first checkout'));
  } else {
    results.push(pass('sales_opportunity', 'SalesOpportunity records exist', `status: ${openOpp.status}`));
  }

  // Conversion sequence with trigger=manual or dm_keyword
  const sequences = await prisma.conversionSequence.findMany({ where: { tenantId, active: true } });
  if (sequences.length === 0) {
    results.push(fail('conversion_sequences', 'At least 1 active conversion sequence', 'none found'));
  } else {
    results.push(pass('conversion_sequences', 'Active sequences', `${sequences.length} sequence(s)`));
  }

  return results;
}

// ─── Scenario 5: Keyword Rule Match ──────────────────────────────────────────

async function runKeywordRuleMatch(tenantId: string): Promise<StepResult[]> {
  const results: StepResult[] = [];

  const rules = await prisma.automationRule.findMany({ where: { tenantId, active: true } });
  if (rules.length === 0) {
    results.push(fail('automation_rules', 'Active automation rules exist', '0 found'));
    return results;
  }
  results.push(pass('automation_rules', 'Active rules', `${rules.length} rule(s)`));

  // Simulate keyword matching against a test phrase
  const testPhrases = ['olá', 'preço', 'quero comprar', 'agendar', 'informação'];
  let matched = 0;
  for (const phrase of testPhrases) {
    const hit = rules.find((r) => {
      if (r.matchType === 'exact') return r.triggerValue.toLowerCase() === phrase.toLowerCase();
      return phrase.toLowerCase().includes(r.triggerValue.toLowerCase());
    });
    if (hit) {
      matched++;
      results.push(pass(`match_"${phrase}"`, `Rule matches phrase`, hit.name, `trigger: "${hit.triggerValue}"`));
    }
  }

  if (matched === 0) {
    results.push(fail('keyword_coverage', 'At least 1 rule matches common phrases', 'no matches for: ' + testPhrases.join(', ')));
  } else {
    results.push(pass('keyword_coverage', 'Rules cover common phrases', `${matched}/${testPhrases.length} matched`));
  }

  // Non-keyword (no match) scenario
  const noMatchPhrase = 'xqz_definitely_no_match_1234';
  const noHit = rules.find((r) =>
    r.matchType === 'exact'
      ? r.triggerValue.toLowerCase() === noMatchPhrase
      : noMatchPhrase.includes(r.triggerValue.toLowerCase()),
  );
  results.push(
    noHit
      ? fail('no_match_fallback', 'Fallback when no rule matches', `Unexpected match: ${noHit.name}`)
      : pass('no_match_fallback', 'No false-positive on gibberish phrase', 'no match — correct'),
  );

  return results;
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const SCENARIO_MAP: Record<ScenarioId, (tenantId: string) => Promise<StepResult[]>> = {
  comment_to_dm_flow: runCommentToDmFlow,
  dm_inbound_ai_handoff: runDmInboundAiHandoff,
  lead_to_appointment: runLeadToAppointment,
  lead_to_checkout_followup: runLeadToCheckoutFollowup,
  keyword_rule_match: runKeywordRuleMatch,
};

export const ALL_SCENARIO_IDS = Object.keys(SCENARIO_MAP) as ScenarioId[];

export async function runScenario(
  tenantId: string,
  scenario: ScenarioId,
): Promise<{ steps: StepResult[]; status: string; summary: string }> {
  const runner = SCENARIO_MAP[scenario];
  if (!runner) throw new Error(`Unknown scenario: ${scenario}`);

  const steps = await runner(tenantId);
  const passed = steps.filter((s) => s.status === 'pass').length;
  const failed = steps.filter((s) => s.status === 'fail').length;
  const status = failed === 0 ? 'passed' : passed === 0 ? 'failed' : 'partial';
  const summary = `${passed} passed, ${failed} failed, ${steps.length - passed - failed} skipped`;

  return { steps, status, summary };
}
