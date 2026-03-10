-- Migration para Arquitetura Multi-Tenant

-- 1. Criar tabela de tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp_phone_id TEXT UNIQUE NOT NULL,
    whatsapp_token TEXT NOT NULL,
    openai_key TEXT NOT NULL,
    ai_prompt TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Adicionar coluna tenant_id na tabela conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 3. Adicionar constraint de chave estrangeira (opcional, mas recomendado)
-- ALTER TABLE conversations ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- 4. Indexar por whatsapp_phone_id para buscas rápidas no webhook
CREATE INDEX IF NOT EXISTS idx_tenants_phone_id ON tenants(whatsapp_phone_id);
