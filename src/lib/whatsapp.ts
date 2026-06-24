import {
  sendTextMessage as kirimdevSendText,
  sendTemplateMessage as kirimdevSendTemplate,
  validateKirimdevConfig,
} from "@/lib/kirimdev";
import {
  sendApplicationCreated,
  sendApplicationApproved,
  sendApplicationRejected,
  sendRevisionRequest,
  isWhatsAppConfigured,
} from "@/lib/whatsapp-sender";

const DASHBOARD_URL = "https://smartcemetary.web.id/";

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  const normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("08")) {
    return "62" + normalized.slice(1);
  }
  if (normalized.startsWith("8")) {
    return "62" + normalized;
  }
  if (normalized.startsWith("+62")) {
    return normalized.replace(/^\+/, "");
  }
  return normalized;
}

export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^62\d{9,14}$/.test(normalized);
}

export async function sendWhatsAppMessage(
  target: string,
  message: string,
  options?: {
    template?: string;
    templateLanguage?: string;
    templateComponents?: Array<{
      type: "header" | "body" | "footer" | "button";
      parameters?: Array<{ type: "text"; text: string }>;
      index?: number;
    }>;
  },
): Promise<{ success: boolean; error?: string; response?: unknown }> {
  const configCheck = validateKirimdevConfig();
  if (!configCheck.valid) {
    console.error("[WA] Kirimdev not configured:", configCheck.errors.join(", "));
    return { success: false, error: "Kirimdev not configured: " + configCheck.errors.join(", ") };
  }

  if (!target || !message) {
    return { success: false, error: "Target and message are required" };
  }

  const normalizedTarget = normalizePhone(target);

  if (!isValidPhone(normalizedTarget)) {
    console.error("[WA] Invalid phone:", target);
    return { success: false, error: `Invalid phone number: ${target}` };
  }

  try {
    if (options?.template) {
      const result = await kirimdevSendTemplate(
        normalizedTarget,
        options.template,
        options.templateLanguage || "id",
        options.templateComponents,
      );

      if (result.success) {
        return { success: true, response: result.data };
      }
      return { success: false, error: result.error, response: result };
    }

    const result = await kirimdevSendText(normalizedTarget, message);

    if (result.success) {
      return { success: true, response: result.data };
    }

    return { success: false, error: result.error, response: result };
  } catch (error) {
    console.error("[WA] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function buildNewSubmissionMessage(data: {
  applicantName: string;
  deceasedName: string;
}): string {
  return `[E-Makam Notification]

Ada pengajuan baru yang menunggu verifikasi.

Nama Pemohon  : ${data.applicantName}
Nama Jenazah  : ${data.deceasedName}
Status        : Menunggu Verifikasi

Silakan login ke dashboard E-Makam untuk memverifikasi dokumen.`;
}

export function buildRevisionResubmissionMessage(data: {
  applicantName: string;
  deceasedName: string;
}): string {
  return `[E-Makam Notification]

Dokumen revisi telah diunggah ulang.

Nama Pemohon  : ${data.applicantName}
Nama Jenazah  : ${data.deceasedName}
Status        : Menunggu Verifikasi

Silakan login ke dashboard E-Makam untuk memverifikasi ulang.`;
}

export function buildApprovedMessage(data: {
  pengajuanId?: string;
  blok?: string;
  nomor?: string;
}): string {
  return `[E-Makam]
Pengajuan makam Anda telah DITERIMA.

ID: #${(data.pengajuanId || "N/A").slice(0, 8)}
Blok: ${data.blok || "-"}
Nomor: ${data.nomor || "-"}

Buka Dashboard: ${DASHBOARD_URL}`;
}

export function buildRevisionNeededMessage(data: {
  pengajuanId?: string;
  revisionNote?: string;
}): string {
  return `[E-Makam]
Pengajuan memerlukan revisi.

ID: #${(data.pengajuanId || "N/A").slice(0, 8)}
Catatan: ${data.revisionNote || "-"}

Silakan login untuk revisi.
atau buka: ${DASHBOARD_URL}/dashboard/pengajuan/revision`;
}

export function buildRejectedMessage(data: { pengajuanId?: string }): string {
  return `[E-Makam]
Pengajuan telah DITOLAK.

ID: #${(data.pengajuanId || "N/A").slice(0, 8)}

Silakan login ke dashboard E-Makam untuk melihat informasi.`;
}

export function buildSubmissionConfirmation(data: {
  pengajuanId: string;
  applicantName: string;
  nik: string;
}): string {
  return `[E-Makam]
Pengajuan berhasil dikirim!

ID: #${data.pengajuanId.slice(0, 8)}
Nama: ${data.applicantName}
NIK: ${data.nik}

Status: Menunggu Verifikasi

Cek status: ${DASHBOARD_URL}/dashboard/pengajuan`;
}

export async function notifyAdminNewSubmission(data: {
  adminPhone: string;
  applicantName: string;
  deceasedName: string;
}) {
  return sendWhatsAppMessage(
    data.adminPhone,
    buildNewSubmissionMessage({
      applicantName: data.applicantName,
      deceasedName: data.deceasedName,
    }),
  );
}

export async function notifyAdminRevisionResubmission(data: {
  adminPhone: string;
  applicantName: string;
  deceasedName: string;
}) {
  return sendWhatsAppMessage(
    data.adminPhone,
    buildRevisionResubmissionMessage({
      applicantName: data.applicantName,
      deceasedName: data.deceasedName,
    }),
  );
}

/* ── User Status Change Notifications (Template-based) ────── */

export async function notifyUserStatusChange(data: {
  userPhone: string;
  pengajuanId: string;
  applicantName: string;
  deceasedName: string;
  status: "APPROVED" | "REJECTED" | "NEED_REVISION";
  blok?: string;
  nomor?: string;
  revisionNote?: string;
  rejectionReason?: string;
  burialDate?: string;
  revisionDocs?: string;
}) {
  console.log("[WA] notifyUserStatusChange called:", data.status, data.pengajuanId);

  if (!isWhatsAppConfigured()) {
    console.log("[WA] Skipping — Kirimdev not configured");
    return { success: false, error: "Kirimdev not configured" };
  }

  if (!isValidPhone(data.userPhone)) {
    console.log("[WA] Skipping — invalid phone:", data.userPhone);
    return { success: false, error: "Invalid phone" };
  }

  switch (data.status) {
    case "APPROVED":
      return sendApplicationApproved(
        data.pengajuanId,
        data.applicantName,
        data.deceasedName,
        data.userPhone,
        data.blok || "TBA",
        data.nomor || "TBA"
      );

    case "NEED_REVISION":
      return sendRevisionRequest(
        data.pengajuanId,
        data.applicantName,
        data.deceasedName,
        data.userPhone,
        data.revisionDocs || "",
        data.revisionNote || ""
      );

    case "REJECTED":
      return sendApplicationRejected(
        data.pengajuanId,
        data.applicantName,
        data.deceasedName,
        data.userPhone,
        data.rejectionReason || ""
      );

    default:
      return { success: false, error: `Status tidak dikenal: ${data.status}` };
  }
}

/* ── Submission Confirmation (Template-based) ─────────────── */

export async function notifyUserSubmissionConfirmation(data: {
  userPhone: string;
  pengajuanId: string;
  applicantName: string;
  deceasedName: string;
  createdDate: string;
}) {
  console.log("[WA] notifyUserSubmissionConfirmation called:", data.pengajuanId);

  if (!isWhatsAppConfigured()) {
    console.log("[WA] Skipping — Kirimdev not configured");
    return { success: false, error: "Kirimdev not configured" };
  }

  if (!isValidPhone(data.userPhone)) {
    console.log("[WA] Skipping — invalid phone:", data.userPhone);
    return { success: false, error: "Invalid phone" };
  }

  return sendApplicationCreated(
    data.pengajuanId,
    data.applicantName,
    data.deceasedName,
    data.userPhone,
    data.createdDate
  );
}

export function getAdminWhatsAppNumber(): string | undefined {
  return process.env.ADMIN_WHATSAPP_NUMBER;
}
