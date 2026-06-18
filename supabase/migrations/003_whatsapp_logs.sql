-- WhatsApp Send Logs: Track all outbound WhatsApp template messages
-- Migration: whatsapp_logs
--
-- Records every WhatsApp message sent via KirimDev for audit trail,
-- debugging, and resend capability.

-- ── 1. WHATSAPP LOGS TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID REFERENCES pengajuan(id) ON DELETE SET NULL,
  recipient_number TEXT NOT NULL,
  template_name TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  api_response JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_pengajuan ON whatsapp_logs(pengajuan_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_sent ON whatsapp_logs(sent_at DESC);
