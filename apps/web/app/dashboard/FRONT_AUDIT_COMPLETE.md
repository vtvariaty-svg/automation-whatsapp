# Front Regression Audit — F7 Complete
_Date: 2026-03-16_

---

## Completeness Checklist

### Onboarding Flow
- ✅ Step 5 ("Sucesso") has four CTAs: Ver Conversas, Gerenciar Automações, Testar Automação, Ver Dashboard
- ✅ Step 1 links to `/dashboard/integrations` for WhatsApp channel connection
- ✅ Step progress indicator shows all 5 steps with back/forward navigation
- ✅ "Voltar para IA" / "Ir para Inbox" CTAs present

### Channel Connection (Integrations)
- ✅ WhatsApp, Instagram, Facebook cards with status badges
- ✅ Embedded Signup (1-click) + Manual fallback for WhatsApp
- ✅ "Conectado" state shows account details (WABA ID, Phone Number ID, phone number)
- ✅ **FIXED (F7):** "Ver Conversas →" CTA added to connected state of all three channels (WhatsApp, Instagram, Facebook)
- ✅ Success/error messages shown after OAuth redirect

### Automations
- ✅ Create/edit/delete/toggle rules
- ✅ Toast feedback on activate/deactivate
- ✅ Error state with retry button
- ✅ **FIXED (F7):** "Ir para Inbox →" link added to the page header so users can test automations immediately in conversations

### Inbox / AI–Human Handoff
- ✅ Channel filter (All / WhatsApp / Instagram / Facebook)
- ✅ Search conversations
- ✅ "🤖 IA" and "👤 Humano" status badges on conversation list
- ✅ Chat header shows current status with color-coded dot
- ✅ **FIXED (F7):** "Assumir" button label clarified to "Assumir conversa"
- ✅ "Voltar para IA" button present when status is "human"
- ✅ "Encerrar" button present when conversation is not closed
- ✅ Closed conversation shows lock state — input disabled
- ✅ Auto-refresh every 5 s (chat) / 10 s (list)
- ⚠️ No customer name field — shows phone number only (no contacts/CRM table in DB)

### Trial → Block → Upgrade
- ✅ `TrialBanner` shows days remaining in top bar for active trials
- ✅ `TrialBanner` shows "⛔ Trial expirado" in red when `daysLeft <= 0`
- ✅ Both states have "Fazer upgrade →" CTA linking to `/dashboard/billing`
- ✅ **FIXED (F7):** Billing page now shows a hard red banner ("⛔ Trial expirado" / "⛔ Assinatura cancelada") with "Assinar agora →" anchor-linked to the plans grid
- ✅ Billing page plans grid shows current plan badge; checkout flow redirects to Stripe

### Support / Diagnostics (Admin)
- ✅ Non-superadmin users see "Acesso restrito — Esta página é exclusiva para superadmins."
- ✅ Superadmin sees full diagnostics: tenant selector, channel cards, kill switch, automations pause/resume, dead-letter errors, audit trail, support notes
- ✅ Superadmin panel links in Sidebar bottom section (Diagnóstico, Retenção, Feedback, Demo, Go-Live, Atribuição, Churn, Expansão, Referral, Ops)

### Onboarding CTA in Sidebar / Dashboard
- ✅ `SetupChecklist` component in `dashboard/page.tsx` shows pending setup items (WhatsApp, IA, services, automations)
- ✅ Prominent "Ativar agora →" CTA links to `/dashboard/onboarding` from checklist
- ✅ Checklist hides itself when all 6 items are complete (no noise for fully-activated users)
- ✅ "Acesso Rápido" grid on dashboard includes "Ativar Automação → /dashboard/onboarding"
- ✅ Sidebar "Canais & IA" section groups Canais, Configuração de IA, Respostas Rápidas, Templates, Marketplace, Insights

### CRM / Contacts
- ⚠️ No dedicated `/dashboard/contacts` or CRM page exists
- ⚠️ Customer identification is phone-number based only (formatted `(XX) XXXXX-XXXX`)
- ⚠️ Channel icon (WhatsApp/Instagram/Facebook) and last message are shown in inbox
- Verdict: **CRM via Inbox** — acceptable workaround for current product scope

---

## Remaining Issues (Not Blocking)

| Issue | Severity | Notes |
|---|---|---|
| Conversations list shows phone only — no contact name | Low | Requires contacts table + name resolution at API level |
| Billing page "Plano Atual" in Sidebar is hardcoded to "Starter" | Low | Should be dynamic from subscription API |
| `StatusRow` for "Motor de IA" uses `process.env.NEXT_PUBLIC_OPENAI_API_KEY` client-side check | Low | Key should not be exposed; use a server health endpoint |
| `aiResponseRate` in dashboard is hardcoded to 94% when there are conversations | Low | Should come from real analytics |
| `messagesThisMonth` approximated as `convs.length * 12` | Low | Should come from real message count API |
| No sandbox/test-send page linked from automations empty state | Low | `/dashboard/sandbox` exists but only linked from onboarding step 5 |

---

## Pending Backlog (Nice-to-have, Not Blocking)

- [ ] Dedicated `/dashboard/contacts` page with search, tags, conversation history per contact
- [ ] "Test this automation" button inside the automation edit modal (sends a test to sandbox)
- [ ] Billing page: show real current plan name from API in Sidebar bottom widget
- [ ] Push/webhook notification when a conversation enters "human" status (browser notification or badge)
- [ ] Conversation assignment to specific agents (multi-agent teams)
- [ ] Bulk actions in conversations list (mark all as closed, assign to agent)
- [ ] Stripe customer portal link on billing page for payment method updates
