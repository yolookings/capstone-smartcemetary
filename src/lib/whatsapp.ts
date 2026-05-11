const FONNTE_API_URL = "https://api.fonnte.com/send";

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
  }
): Promise<{ success: boolean; error?: string; response?: any }> {
  const token = process.env.FONNTE_TOKEN;
  
  if (!token) {
    return { success: false, error: "FONNTE_TOKEN not configured" };
  }
  
  if (!target || !message) {
    return { success: false, error: "Target and message are required" };
  }
  
  const normalizedTarget = normalizePhone(target);
  
  if (!isValidPhone(normalizedTarget)) {
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
    
    if (response.ok && result.status === true) {
      return { success: true, response: result };
    }
    
    return { success: false, error: result.message || "Failed", response: result };
  } catch (error) {
    console.error("[FONNTE ERROR]", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function buildNewSubmissionMessage(data: { applicantName: string; deceasedName: string }): string {
  return `[E-Makam Notification]

Ada pengajuan baru yang menunggu verifikasi.

Nama Pemohon  : ${data.applicantName}
Nama Jenazah  : ${data.deceasedName}
Status        : Menunggu Verifikasi

Silakan login ke dashboard E-Makam untuk memverifikasi dokumen.`;
}

export function buildRevisionResubmissionMessage(data: { applicantName: string; deceasedName: string }): string {
  return `[E-Makam Notification]

Dokumen revisi telah diunggah ulang.

Nama Pemohon  : ${data.applicantName}
Nama Jenazah  : ${data.deceasedName}
Status        : Menunggu Verifikasi

Silakan login ke dashboard E-Makam untuk memverifikasi ulang.`;
}

export function buildApprovedMessage(data: { blok?: string; nomor?: string }): string {
  return `[E-Makam]

Pendaftaran makam telah DISETUJUI.

Lokasi Makam:
Blok ${data.blok || "-"} - Nomor ${data.nomor || "-"}

Silakan login ke sistem untuk detail lengkap.`;
}

export function buildRevisionNeededMessage(data: { revisionNote: string }): string {
  return `[E-Makam]

Pengajuan memerlukan revisi dokumen.

Catatan Admin:
"${data.revisionNote}"

Silakan login ke website E-Makam untuk melengkapi revisi.`;
}

export function buildRejectedMessage(): string {
  return `[E-Makam]

Pengajuan telah DITOLAK.

Silakan login ke dashboard E-Makam untuk melihat penjelasan.`;
}

export async function notifyAdminNewSubmission(data: { adminPhone: string; applicantName: string; deceasedName: string }) {
  return sendWhatsAppMessage(
    data.adminPhone,
    buildNewSubmissionMessage({ applicantName: data.applicantName, deceasedName: data.deceasedName })
  );
}

export async function notifyAdminRevisionResubmission(data: { adminPhone: string; applicantName: string; deceasedName: string }) {
  return sendWhatsAppMessage(
    data.adminPhone,
    buildRevisionResubmissionMessage({ applicantName: data.applicantName, deceasedName: data.deceasedName })
  );
}

export async function notifyUserStatusChange(data: {
  userPhone: string;
  status: "APPROVED" | "REJECTED" | "NEED_REVISION";
  blok?: string;
  nomor?: string;
  revisionNote?: string;
}) {
  switch (data.status) {
    case "APPROVED":
      return sendWhatsAppMessage(data.userPhone, buildApprovedMessage({ blok: data.blok, nomor: data.nomor }));
    case "NEED_REVISION":
      return sendWhatsAppMessage(data.userPhone, buildRevisionNeededMessage({ revisionNote: data.revisionNote || "" }));
    case "REJECTED":
      return sendWhatsAppMessage(data.userPhone, buildRejectedMessage());
  }
}

export function getAdminWhatsAppNumber(): string | undefined {
  return process.env.ADMIN_WHATSAPP_NUMBER;
}