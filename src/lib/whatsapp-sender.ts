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
 * Each builder returns the body component with parameters matching
 * the Meta-approved template variables ({{1}}, {{2}}, etc.).
 * All templates use Indonesian language.
 */

function bodyParams(params: string[]): TemplateComponent[] {
  return [
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
  const payload = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "id" },
      components: bodyParams(params),
    },
  };

  const result = await sendTemplateMessage(
    recipientPhone,
    templateName,
    "id",
    bodyParams(params)
  );

  const logEntry = {
    pengajuan_id: pengajuanId,
    recipient_number: recipientPhone,
    template_name: templateName,
    payload: payload as unknown as Record<string, unknown>,
    status: result.success ? ("success" as const) : ("failed" as const),
    error_message: result.success ? undefined : result.error,
    api_response: result.success
      ? (result.data as unknown as Record<string, unknown>)
      : undefined,
  };

  const log = await insertLog(logEntry);

  if (result.success) {
    return { success: true, log };
  }
  return { success: false, log, error: result.error };
}

/* ── Template 1: application_created ─────────────────────────
 * {{1}} = Applicant Name
 * {{2}} = Deceased Name
 * {{3}} = Application Number (EKM-XXXX-XXXX)
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
  return sendAndLogTemplate(pengajuanId, applicantPhone, "application_created", [
    applicantName,
    deceasedName,
    refNumber,
    formatDate(createdDate),
  ]);
}

/* ── Template 2: application_approved ─────────────────────────
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
  return sendAndLogTemplate(pengajuanId, applicantPhone, "application_approved", [
    applicantName,
    deceasedName,
    refNumber,
    blok,
    nomor,
  ]);
}

/* ── Template 3: revision_request ────────────────────────────
 * {{1}} = Applicant Name
 * {{2}} = Deceased Name
 * {{3}} = List of documents requiring revision
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
  return sendAndLogTemplate(pengajuanId, applicantPhone, "revision_request", [
    applicantName,
    deceasedName,
    revisionDocs,
    staffNotes,
  ]);
}

/* ── Template 4: application_rejected ─────────────────────────
 * {{1}} = Applicant Name
 * {{2}} = Deceased Name
 * {{3}} = Application Number
 * {{4}} = Reason for Rejection
 */

export async function sendApplicationRejected(
  pengajuanId: string,
  applicantName: string,
  deceasedName: string,
  applicantPhone: string,
  rejectionReason: string
): Promise<SendResult> {
  const refNumber = generateReferenceNumber(pengajuanId);
  return sendAndLogTemplate(pengajuanId, applicantPhone, "application_rejected", [
    applicantName,
    deceasedName,
    refNumber,
    rejectionReason,
  ]);
}

/* ── Template 5: grave_plot_allocated ─────────────────────────
 * {{1}} = Applicant Name
 * {{2}} = Deceased Name
 * {{3}} = Grave Block
 * {{4}} = Plot Number
 * {{5}} = Date of Burial
 */

export async function sendGravePlotAllocated(
  pengajuanId: string,
  applicantName: string,
  deceasedName: string,
  applicantPhone: string,
  blok: string,
  nomor: string,
  burialDate: string
): Promise<SendResult> {
  return sendAndLogTemplate(pengajuanId, applicantPhone, "grave_plot_allocated", [
    applicantName,
    deceasedName,
    blok,
    nomor,
    formatDate(burialDate),
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
  if (templateName === "application_created") {
    params.push("Test User", "Test Deceased", "EKM-TEST-0001", "1 Januari 2026");
  } else if (templateName === "application_approved") {
    params.push("Test User", "Test Deceased", "EKM-TEST-0001", "Blok A", "1");
  } else if (templateName === "revision_request") {
    params.push("Test User", "Test Deceased", "Foto KTP", "Mohon upload ulang KTP");
  } else if (templateName === "application_rejected") {
    params.push("Test User", "Test Deceased", "EKM-TEST-0001", "Data tidak sesuai");
  } else if (templateName === "grave_plot_allocated") {
    params.push("Test User", "Test Deceased", "Blok A", "1", "1 Januari 2026");
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
  const components = loggedPayload?.template?.components;

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
