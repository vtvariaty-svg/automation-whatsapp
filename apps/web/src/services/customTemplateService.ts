import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';

/**
 * Submits a CustomTemplate to the Meta Graph API for approval.
 * Updates the template status in DB based on the result.
 */
export async function submitToMeta(
  tenantId: string,
  templateId: string
): Promise<{ ok: boolean; error?: string }> {
  const template = await prisma.customTemplate.findUnique({ where: { id: templateId } });
  if (!template) return { ok: false, error: 'Template não encontrado' };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { whatsappToken: true, whatsappBusinessAccountId: true, whatsappConnection: true },
  });

  const rawToken = tenant?.whatsappConnection?.accessToken || tenant?.whatsappToken;
  const token = rawToken ? decrypt(rawToken) : null;
  const wabaId = tenant?.whatsappConnection?.wabaId || tenant?.whatsappBusinessAccountId;

  if (!token || !wabaId) {
    return {
      ok: false,
      error: 'WhatsApp Business não configurado. Template salvo como rascunho — submeta após configurar a integração.',
    };
  }

  // Build Meta components
  const components: any[] = [];

  if (template.header) {
    components.push({ type: 'HEADER', format: 'TEXT', text: template.header });
  }

  const bodyComponent: any = { type: 'BODY', text: template.body };
  if (template.exampleVars.length > 0) {
    bodyComponent.example = { body_text: [template.exampleVars] };
  }
  components.push(bodyComponent);

  if (template.footer) {
    components.push({ type: 'FOOTER', text: template.footer });
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: template.name,
        category: template.category,
        language: template.language,
        components,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.error?.error_user_msg || data.error?.message || 'Erro ao submeter template à Meta';
      await prisma.customTemplate.update({
        where: { id: templateId },
        data: { status: 'REJECTED', rejectedReason: msg },
      });
      return { ok: false, error: msg };
    }

    await prisma.customTemplate.update({
      where: { id: templateId },
      data: {
        metaTemplateId: String(data.id),
        status: data.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
        lastSyncAt: new Date(),
      },
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Syncs the status of a local CustomTemplate from the Meta Graph API.
 * Queries by template name (Meta listing scoped to the WABA).
 * Updates lastSyncAt, status, metaTemplateId, and rejectedReason.
 */
export async function syncTemplateStatusFromMeta(
  tenantId: string,
  templateId: string
): Promise<{ ok: boolean; status?: string; error?: string }> {
  const template = await prisma.customTemplate.findFirst({
    where: { id: templateId, tenantId },
  });
  if (!template) return { ok: false, error: 'Template não encontrado' };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { whatsappToken: true, whatsappBusinessAccountId: true, whatsappConnection: true },
  });

  const rawToken = tenant?.whatsappConnection?.accessToken || tenant?.whatsappToken;
  const token = rawToken ? decrypt(rawToken) : null;
  const wabaId = tenant?.whatsappConnection?.wabaId || tenant?.whatsappBusinessAccountId;

  if (!token || !wabaId) {
    return { ok: false, error: 'WhatsApp Business não configurado.' };
  }

  try {
    // Query provider by name (Meta allows listing by name filter)
    const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?name=${encodeURIComponent(template.name)}&fields=id,name,status,rejected_reason`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.error?.message || 'Erro ao consultar status do template na Meta';
      return { ok: false, error: msg };
    }

    // Meta returns {data: [...]} — find the matching template
    const providerTemplates: any[] = data.data || [];
    const match = providerTemplates.find(
      (t: any) =>
        t.name === template.name &&
        (!template.metaTemplateId || String(t.id) === template.metaTemplateId)
    );

    if (!match) {
      // Template not found on Meta — it may not have been submitted yet
      return { ok: false, error: 'Template não encontrado na Meta. Verifique se foi submetido.' };
    }

    const newStatus = normalizeMetaStatus(match.status);
    const newRejectedReason = match.rejected_reason || null;

    await prisma.customTemplate.update({
      where: { id: templateId },
      data: {
        metaTemplateId: String(match.id),
        status: newStatus,
        rejectedReason: newRejectedReason,
        lastSyncAt: new Date(),
      },
    });

    return { ok: true, status: newStatus };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Normalizes Meta provider status strings to our local status values.
 */
function normalizeMetaStatus(metaStatus: string): string {
  switch ((metaStatus || '').toUpperCase()) {
    case 'APPROVED':
      return 'APPROVED';
    case 'REJECTED':
    case 'DISABLED':
      return 'REJECTED';
    case 'PENDING':
    case 'IN_APPEAL':
    case 'PENDING_DELETION':
    default:
      return 'PENDING';
  }
}
