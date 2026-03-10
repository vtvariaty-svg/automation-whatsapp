-- Adicionar colunas de configuração de IA na tabela tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS welcome_message TEXT,
ADD COLUMN IF NOT EXISTS business_hours TEXT;
