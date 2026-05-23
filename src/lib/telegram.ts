const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

export function getAdminTelegramIds(): string[] {
  const envValue = process.env.ADMIN_TELEGRAM_IDS;
  if (!envValue) return [];
  return envValue.split(",").map(id => id.trim()).filter(id => id.length > 0);
}

export function validateTelegramConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    errors.push("TELEGRAM_BOT_TOKEN is required");
  }
  if (!process.env.ADMIN_TELEGRAM_IDS) {
    errors.push("ADMIN_TELEGRAM_IDS is required");
  }
  return { valid: errors.length === 0, errors };
}

export async function sendTelegramMessage(
  chatId: string,
  message: string,
  options?: {
    parseMode?: "Markdown" | "HTML";
    disableWebPagePreview?: boolean;
    disableNotification?: boolean;
    replyMarkup?: unknown;
  }
): Promise<{ success: boolean; error?: string; response?: unknown }> {
  const token = getBotToken();
  
  if (!token) {
    return { success: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }
  
  if (!chatId || !message) {
    return { success: false, error: "chatId and message are required" };
  }
  
  if (isNaN(Number(chatId))) {
    return { success: false, error: "Invalid chatId format - must be numeric string" };
  }
  
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: options?.parseMode || "Markdown",
        disable_web_page_preview: options?.disableWebPagePreview || true,
        disable_notification: options?.disableNotification || false,
        reply_markup: options?.replyMarkup,
      }),
    });
    
    const result = await response.json();
    
    console.log("[TELEGRAM SEND]", { chatId, success: result.ok, messageId: result.result?.message_id });
    
    if (result.ok) {
      return { success: true, response: result };
    }
    
    const errorMsg = result.description || "Failed to send message";
    console.error("[TELEGRAM ERROR]", { chatId, error: errorMsg, code: result.error_code });
    
    return { success: false, error: errorMsg, response: result };
  } catch (error) {
    console.error("[TELEGRAM NETWORK ERROR]", { chatId, error: error instanceof Error ? error.message : "Unknown" });
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

export async function sendBulkTelegramMessage(
  chatIds: string[],
  message: string,
  options?: {
    staggerDelay?: number;
    parseMode?: "Markdown" | "HTML";
  }
): Promise<{ sent: number; failed: number; results: Array<{ chatId: string; success: boolean; error?: string }> }> {
  const results: Array<{ chatId: string; success: boolean; error?: string }> = [];
  let sent = 0;
  let failed = 0;
  
  for (const chatId of chatIds) {
    const result = await sendTelegramMessage(chatId, message, { parseMode: options?.parseMode });
    
    if (result.success) {
      sent++;
      results.push({ chatId, success: true });
    } else {
      failed++;
      results.push({ chatId, success: false, error: result.error });
    }
    
    if (options?.staggerDelay && options.staggerDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, options.staggerDelay));
    }
  }
  
  return { sent, failed, results };
}

export function buildNewSubmissionMessage(data: { pengajuanId: string; applicantName: string; nik: string; relationship: string }): string {
  return `🟢 *E-Makam • Pengajuan Baru*

ID: #${data.pengajuanId.slice(0, 8)}

Ada pengajuan baru yang menunggu verifikasi admin.

👤 *Nama Pemohon:* ${data.applicantName}
🆔 *NIK:* ${data.nik}
👥 *Hubungan:* ${data.relationship}
📌 *Status:* Menunggu Verifikasi

Silakan login ke dashboard E-Makam untuk memverifikasi dokumen.`;
}

export function buildRevisionResubmissionMessage(data: { pengajuanId: string; applicantName: string; nik: string; relationship: string }): string {
  return `🟡 *E-Makam • Dokumen Revisi*

ID: #${data.pengajuanId.slice(0, 8)}

Dokumen revisi telah diunggah ulang dan menunggu verifikasi ulang admin.

👤 *Nama Pemohon:* ${data.applicantName}
🆔 *NIK:* ${data.nik}
👥 *Hubungan:* ${data.relationship}
📌 *Status:* Menunggu Verifikasi Ulang

Silakan login ke dashboard E-Makam untuk melakukan verifikasi ulang.`;
}

export function buildApprovedMessage(data: { pengajuanId: string; blok?: string; nomor?: string }): string {
  return `✅ *E-Makam • Pengajuan Disetujui*

ID: #${data.pengajuanId.slice(0, 8)}

Pengajuan makam Anda telah *DITERIMA*.

📍 *Blok:* ${data.blok || "-"}
🪦 *Nomor Makam:* ${data.nomor || "-"}

Silakan login ke sistem untuk melihat detail lengkap.`;
}

export function buildRevisionNeededMessage(data: { pengajuanId: string; revisionNote: string }): string {
  return `⚠️ *E-Makam • Revisi Dokumen Diperlukan*

ID: #${data.pengajuanId.slice(0, 8)}

Pengajuan Anda memerlukan revisi dokumen.

📝 *Catatan Admin:*
${data.revisionNote}

Silakan login ke website E-Makam untuk melakukan revisi.`;
}

export function buildRejectedMessage(data: { pengajuanId: string }): string {
  return `❌ *E-Makam • Pengajuan Ditolak*

ID: #${data.pengajuanId.slice(0, 8)}

Mohon maaf, pengajuan Anda telah ditolak.

Silakan login ke dashboard E-Makam untuk melihat informasi lebih lanjut.`;
}

export async function notifyAdminsNewSubmission(data: { pengajuanId: string; applicantName: string; nik: string; relationship: string }) {
  const adminIds = getAdminTelegramIds();
  
  if (adminIds.length === 0) {
    console.warn("[TELEGRAM] No admin IDs configured");
    return { sent: 0, failed: 0, results: [] };
  }
  
  const message = buildNewSubmissionMessage({ pengajuanId: data.pengajuanId, applicantName: data.applicantName, nik: data.nik, relationship: data.relationship });
  return sendBulkTelegramMessage(adminIds, message, { staggerDelay: 500 });
}

export async function notifyAdminsRevisionResubmission(data: { pengajuanId: string; applicantName: string; nik: string; relationship: string }) {
  const adminIds = getAdminTelegramIds();
  
  if (adminIds.length === 0) {
    console.warn("[TELEGRAM] No admin IDs configured");
    return { sent: 0, failed: 0, results: [] };
  }
  
  const message = buildRevisionResubmissionMessage({ pengajuanId: data.pengajuanId, applicantName: data.applicantName, nik: data.nik, relationship: data.relationship });
  return sendBulkTelegramMessage(adminIds, message, { staggerDelay: 500 });
}

export async function notifyUserStatusChange(data: {
  userChatId: string;
  status: "APPROVED" | "REJECTED" | "NEED_REVISION";
  pengajuanId?: string;
  blok?: string;
  nomor?: string;
  revisionNote?: string;
}) {
  switch (data.status) {
    case "APPROVED":
      return sendTelegramMessage(data.userChatId, buildApprovedMessage({ pengajuanId: data.pengajuanId || "N/A", blok: data.blok, nomor: data.nomor }));
    case "NEED_REVISION":
      return sendTelegramMessage(data.userChatId, buildRevisionNeededMessage({ pengajuanId: data.pengajuanId || "N/A", revisionNote: data.revisionNote || "" }));
    case "REJECTED":
      return sendTelegramMessage(data.userChatId, buildRejectedMessage({ pengajuanId: data.pengajuanId || "N/A" }));
  }
}