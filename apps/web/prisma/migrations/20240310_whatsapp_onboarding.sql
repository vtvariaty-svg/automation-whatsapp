-- Adicionar colunas do Embedded Signup do WhatsApp na tabela tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT;

-- Indexar o novo phone_number_id para buscas rápidas (usado pelo webhook)
CREATE INDEX IF NOT EXISTS idx_tenants_phone_number_id ON tenants(whatsapp_phone_number_id);
