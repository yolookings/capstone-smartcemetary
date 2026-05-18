const FONNTE_API_URL = "https://api.fonnte.com/send";
const DASHBOARD_URL = "https://capstone-smartcemetary.vercel.app/";

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  let normalized = phone.replace(/\D/g, "");
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
    delay?: string;
    typing?: boolean;
    url?: string;
    filename?: string;
  },
): Promise<{ success: boolean; error?: string; response?: any }> {
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    console.error("[WA] FONNTE_TOKEN not configured");
    return { success: false, error: "FONNTE_TOKEN not configured" };
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
    const formData = new URLSearchParams();
    formData.append("target", normalizedTarget);
    formData.append("message", message);

    if (options?.delay) {
      formData.append("delay", options.delay);
    }
    if (options?.typing) {
      formData.append("typing", "true");
    }
    if (options?.url) {
      formData.append("url", options.url);
    }
    if (options?.filename) {
      formData.append("filename", options.filename);
    }

    const response = await fetch(FONNTE_API_URL, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    console.log("[WA] Send result:", {
      target: normalizedTarget,
      status: result.status,
      id: result.id,
    });

    if (response.ok && result.status === true) {
      return { success: true, response: result };
    }

    return {
      success: false,
      error: result.message || "Failed",
      response: result,
    };
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

export async function notifyUserStatusChange(data: {
  userPhone: string;
  status: "APPROVED" | "REJECTED" | "NEED_REVISION";
  pengajuanId?: string;
  blok?: string;
  nomor?: string;
  revisionNote?: string;
}) {
  console.log("[WA] notifyUserStatusChange called:", data);
  switch (data.status) {
    case "APPROVED":
      return sendWhatsAppMessage(
        data.userPhone,
        buildApprovedMessage({
          pengajuanId: data.pengajuanId,
          blok: data.blok,
          nomor: data.nomor,
        }),
      );
    case "NEED_REVISION":
      return sendWhatsAppMessage(
        data.userPhone,
        buildRevisionNeededMessage({
          pengajuanId: data.pengajuanId,
          revisionNote: data.revisionNote,
        }),
      );
    case "REJECTED":
      return sendWhatsAppMessage(
        data.userPhone,
        buildRejectedMessage({ pengajuanId: data.pengajuanId }),
      );
  }
}

export async function notifyUserSubmissionConfirmation(data: {
  userPhone: string;
  pengajuanId: string;
  applicantName: string;
  nik: string;
}) {
  console.log("[WA] notifyUserSubmissionConfirmation called:", data);
  return sendWhatsAppMessage(
    data.userPhone,
    buildSubmissionConfirmation({
      pengajuanId: data.pengajuanId,
      applicantName: data.applicantName,
      nik: data.nik,
    }),
  );
}

export function getAdminWhatsAppNumber(): string | undefined {
  return process.env.ADMIN_WHATSAPP_NUMBER;
}
