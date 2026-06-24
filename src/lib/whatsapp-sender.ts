import {
  sendTemplateMessage,
  sendTextMessage,
  validateKirimdevConfig,
  type TemplateComponent,
} from "@/lib/kirimdev";
import { generateReferenceNumber } from "@/lib/reference-number";
import pool from "@/lib/db";

/* ── Types ────────────────────────────────────────────────── */

export interface WhatsAppLog {
  id: string;
  pengajuan_id: string;
  recipient_number: string;
  template_name: string;
  payload: Record<string, unknown>;
  status: "success" | "failed";
  error_message: string | null;
  api_response: Record<string, unknown> | null;
  sent_at: string;
  created_at: string;
}

export interface SendResult {
  success: boolean;
  log?: WhatsAppLog;
  error?: string;
}

/* ── Config Check ──────────────────────────────────────────── */

export function isWhatsAppConfigured(): boolean {
  const config = validateKirimdevConfig();
  return config.valid;
}

export function getWhatsAppConfigStatus(): {
  configured: boolean;
  errors: string[];
} {
  const result = validateKirimdevConfig();
  return { configured: result.valid, errors: result.errors };
}

/* ── Database Helpers ──────────────────────────────────────── */

async function insertLog(log: {
  pengajuan_id: string;
  recipient_number: string;
  template_name: string;
  payload: Record<string, unknown>;
  status: "success" | "failed";
  error_message?: string;
  api_response?: Record<string, unknown>;
}): Promise<WhatsAppLog> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `INSERT INTO whatsapp_logs (pengajuan_id, recipient_number, template_name, payload, status, error_message, api_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        log.pengajuan_id,
        log.recipient_number,
        log.template_name,
        JSON.stringify(log.payload),
        log.status,
        log.error_message || null,
        log.api_response ? JSON.stringify(log.api_response) : null,
      ]
    );
    return rows[0] as WhatsAppLog;
  } finally {
    client.release();
  }
}

export async function getLogsByPengajuanId(
  pengajuanId: string
): Promise<WhatsAppLog[]> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT * FROM whatsapp_logs WHERE pengajuan_id = $1 ORDER BY sent_at DESC`,
      [pengajuanId]
    );
    return rows as WhatsAppLog[];
  } finally {
    client.release();
  }
}

export async function getLogById(logId: string): Promise<WhatsAppLog | null> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT * FROM whatsapp_logs WHERE id = $1`,
      [logId]
    );
    return (rows[0] as WhatsAppLog) || null;
  } finally {
    client.release();
  }
}

/* ── Template Component Builders ──────────────────────────────
 *
 * Each builder returns the header + body components matching
 * the Meta-approved template variables ({{1}}, {{2}}, etc.).
 * All templates have IMAGE header + BODY text params + static footer/buttons.
 * All templates use Indonesian language.
 */

const HEADER_IMAGE_URL =
  process.env.WHATSAPP_HEADER_IMAGE_URL ||
  "https://smartcemetary.web.id/banner-makam.png";

function templateComponents(params: string[]): TemplateComponent[] {
  return [
    {
      type: "header",
      parameters: [
        { type: "image", image: { link: HEADER_IMAGE_URL } },
      ],
    },
    {
      type: "body",
      parameters: params.map((text) => ({ type: "text" as const, text })),
    },
  ];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ── Core Send + Log Function ──────────────────────────────── */

async function sendAndLogTemplate(
  pengajuanId: string,
  recipientPhone: string,
  templateName: string,
  params: string[]
): Promise<SendResult> {
  const components = templateComponents(params);

  const payload = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "id" },
      components,
    },
  };

  const result = await sendTemplateMessage(
    recipientPhone,
    templateName,
    "id",
    components
  );

  // Attempt to persist log — failure to log does NOT hide the KirimDev result
  let log: WhatsAppLog | undefined;
  try {
    log = await insertLog({
      pengajuan_id: pengajuanId,
      recipient_number: recipientPhone,
      template_name: templateName,
      payload: payload as unknown as Record<string, unknown>,
      status: result.success ? "success" : "failed",
      error_message: result.success ? undefined : result.error,
      api_response: result.success
        ? (result.data as unknown as Record<string, unknown>)
        : undefined,
    });
  } catch (logErr) {
    console.error("[WA-SENDER] Failed to persist log:", logErr);
  }

  if (result.success) {
    return { success: true, log };
  }
  return { success: false, log, error: result.error };
}

/* ── Template 1: pengajuan_dibuat ───────────────────────
 * {{1}} = Applicant Name
 * {{2}} = Deceased Name
 * {{3}} = Application Number
 * {{4}} = Application Date
 */

export async function sendApplicationCreated(
  pengajuanId: string,
  applicantName: string,
  deceasedName: string,
  applicantPhone: string,
  createdDate: string
): Promise<SendResult> {
  const refNumber = generateReferenceNumber(pengajuanId);
  return sendAndLogTemplate(pengajuanId, applicantPhone, "pengajuan_dibuat", [
    applicantName,
    deceasedName,
    refNumber,
    formatDate(createdDate),
  ]);
}

/* ── Template 2: pengajuan_disetujui ────────────────────
 * {{1}} = Applicant Name
 * {{2}} = Deceased Name
 * {{3}} = Application Number
 * {{4}} = Grave Block
 * {{5}} = Plot Number
 */

export async function sendApplicationApproved(
  pengajuanId: string,
  applicantName: string,
  deceasedName: string,
  applicantPhone: string,
  blok: string,
  nomor: string
): Promise<SendResult> {
  const refNumber = generateReferenceNumber(pengajuanId);
  return sendAndLogTemplate(pengajuanId, applicantPhone, "pengajuan_disetujui", [
    applicantName,
    deceasedName,
    refNumber,
    blok,
    nomor,
  ]);
}

/* ── Template 3: permintaan_revisi ──────────────────────
 * {{1}} = Applicant Name
 * {{2}} = Deceased Name
 * {{3}} = Documents needing revision
 * {{4}} = Staff Notes
 */

export async function sendRevisionRequest(
  pengajuanId: string,
  applicantName: string,
  deceasedName: string,
  applicantPhone: string,
  revisionDocs: string,
  staffNotes: string
): Promise<SendResult> {
  return sendAndLogTemplate(pengajuanId, applicantPhone, "permintaan_revisi", [
    applicantName,
    deceasedName,
    revisionDocs,
    staffNotes,
  ]);
}

/* ── Template 4: pengajuan_ditolak ──────────────────────
 * {{1}} = Applicant Name
 * {{2}} = Deceased Name
 * {{3}} = Application Number
 * {{4}} = Rejection Reason
 */

export async function sendApplicationRejected(
  pengajuanId: string,
  applicantName: string,
  deceasedName: string,
  applicantPhone: string,
  rejectionReason: string
): Promise<SendResult> {
  const refNumber = generateReferenceNumber(pengajuanId);
  return sendAndLogTemplate(pengajuanId, applicantPhone, "pengajuan_ditolak", [
    applicantName,
    deceasedName,
    refNumber,
    rejectionReason,
  ]);
}

/* ── Test Send ────────────────────────────────────────────────
 * Sends a test template message to a specified number.
 * Useful for admins to verify the KirimDev integration works.
 */

export async function sendTestMessage(
  phone: string,
  templateName: string
): Promise<SendResult> {
  const testPengajuanId = "00000000-0000-0000-0000-000000000000";

  const config = validateKirimdevConfig();
  if (!config.valid) {
    return {
      success: false,
      error: "KirimDev tidak terkonfigurasi: " + config.errors.join(", "),
    };
  }

  const params: string[] = [];
  if (templateName === "pengajuan_dibuat") {
    params.push("Test User", "Test Deceased", "EKM-TEST-0001", "1 Januari 2026");
  } else if (templateName === "pengajuan_disetujui") {
    params.push("Test User", "Test Deceased", "EKM-TEST-0001", "Blok A", "1");
  } else if (templateName === "permintaan_revisi") {
    params.push("Test User", "Test Deceased", "Foto KTP", "Mohon upload ulang KTP");
  } else if (templateName === "pengajuan_ditolak") {
    params.push("Test User", "Test Deceased", "EKM-TEST-0001", "Data tidak sesuai");
  } else {
    return { success: false, error: `Template "${templateName}" tidak dikenal` };
  }

  return sendAndLogTemplate(testPengajuanId, phone, templateName, params);
}

/* ── Resend ──────────────────────────────────────────────────
 * Re-sends a previously logged WhatsApp message.
 */

export async function resendMessage(logId: string): Promise<SendResult> {
  const log = await getLogById(logId);
  if (!log) {
    return { success: false, error: "Log tidak ditemukan" };
  }

  const loggedPayload = log.payload as {
    template?: { name?: string; components?: TemplateComponent[] };
  };

  const templateName = log.template_name;

  // Extract body text params from the stored log payload
  const bodyComponent = loggedPayload?.template?.components?.find(
    (c) => c.type === "body"
  );
  const bodyTextParams = (bodyComponent?.parameters || [])
    .filter((p) => "text" in p)
    .map((p) => String((p as { text: string }).text));

  // Rebuild components with header image + body params
  const components = bodyTextParams.length > 0
    ? templateComponents(bodyTextParams)
    : undefined;

  const result = await sendTemplateMessage(
    log.recipient_number,
    templateName,
    "id",
    components
  );

  const newLog = await insertLog({
    pengajuan_id: log.pengajuan_id,
    recipient_number: log.recipient_number,
    template_name: templateName,
    payload: log.payload,
    status: result.success ? "success" : "failed",
    error_message: result.success ? undefined : result.error,
    api_response: result.success
      ? (result.data as unknown as Record<string, unknown>)
      : undefined,
  });

  if (result.success) {
    return { success: true, log: newLog };
  }
  return { success: false, log: newLog, error: result.error };
}

/* ── Get Count of Recent Logs ──────────────────────────────── */

export async function getRecentLogs(
  limit: number = 20
): Promise<WhatsAppLog[]> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT * FROM whatsapp_logs ORDER BY sent_at DESC LIMIT $1`,
      [limit]
    );
    return rows as WhatsAppLog[];
  } finally {
    client.release();
  }
}
