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
      },
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
