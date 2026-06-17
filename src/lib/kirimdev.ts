const KIRIMDEV_API_BASE = "https://api.kirimdev.com/v1";

function getApiKey(): string | undefined {
  return process.env.KIRIMDEV_API_KEY;
}

function getPhoneNumberId(): string | undefined {
  return process.env.KIRIMDEV_PHONE_NUMBER_ID;
}

export function validateKirimdevConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!process.env.KIRIMDEV_API_KEY) {
    errors.push("KIRIMDEV_API_KEY is required");
  }
  if (!process.env.KIRIMDEV_PHONE_NUMBER_ID) {
    errors.push("KIRIMDEV_PHONE_NUMBER_ID is required");
  }
  return { valid: errors.length === 0, errors };
}

interface KirimdevSuccessResponse {
  data: {
    id: string;
    object: string;
    to: string;
    type: string;
    status: string;
    created_at: string;
    conversation_id: string;
    message_id: string;
    error: string | null;
  };
  request_id: string;
}

interface KirimdevErrorResponse {
  error: {
    type: string;
    code: string;
    message: string;
    param?: string;
    request_id: string;
  };
}

type KirimdevResponse =
  | { success: true; data: KirimdevSuccessResponse["data"]; request_id: string }
  | { success: false; error: string; code?: string; request_id?: string };

/**
 * Normalize Indonesian phone number to E.164 format (62xxx).
 * 08xxx → 628xxx, +62xxx → 62xxx, 8xxx → 628xxx
 */
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

/**
 * Send a text WhatsApp message via Kirimdev.
 * Requires an open 24h conversation window with the recipient.
 */
export async function sendTextMessage(
  to: string,
  text: string,
): Promise<KirimdevResponse> {
  const apiKey = getApiKey();
  const phoneNumberId = getPhoneNumberId();

  if (!apiKey) {
    return { success: false, error: "KIRIMDEV_API_KEY not configured" };
  }
  if (!phoneNumberId) {
    return { success: false, error: "KIRIMDEV_PHONE_NUMBER_ID not configured" };
  }
  if (!to || !text) {
    return { success: false, error: "Recipient and message text are required" };
  }

  const normalizedTo = normalizePhone(to);
  if (!isValidPhone(normalizedTo)) {
    return { success: false, error: `Invalid phone number: ${to}` };
  }

  try {
    const response = await fetch(
      `${KIRIMDEV_API_BASE}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizedTo,
          type: "text",
          text: { body: text },
        }),
      },
    );

    const result = (await response.json()) as
      | KirimdevSuccessResponse
      | KirimdevErrorResponse;

    if (!response.ok) {
      const err = result as KirimdevErrorResponse;
      console.error("[KIRIMDEV] Send text failed:", {
        to: normalizedTo,
        error: err.error,
      });
      return {
        success: false,
        error: err.error?.message || "Unknown error",
        code: err.error?.code,
        request_id: err.error?.request_id,
      };
    }

    const successResult = result as KirimdevSuccessResponse;
    console.log("[KIRIMDEV] Text sent:", {
      to: normalizedTo,
      messageId: successResult.data.id,
      status: successResult.data.status,
    });

    return {
      success: true,
      data: successResult.data,
      request_id: successResult.request_id,
    };
  } catch (error) {
    console.error("[KIRIMDEV] Network error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Template parameter types supported by Kirimdev / Meta.
 */
export type TemplateParam =
  | { type: "text"; text: string }
  | { type: "currency"; currency: { fallback_value: string; code: string; amount_1000: number } }
  | { type: "date_time"; date_time: { fallback_value: string } }
  | { type: "image"; image: { link: string } }
  | { type: "document"; document: { link: string; filename?: string } }
  | { type: "video"; video: { link: string } };

export interface TemplateComponent {
  type: "header" | "body" | "footer" | "button";
  parameters?: TemplateParam[];
  /** For button type: sub_type, index */
  sub_type?: string;
  index?: number;
}

/**
 * Send a template WhatsApp message via Kirimdev.
 * Templates do NOT require a 24h conversation window (unlike text messages).
 *
 * @param to - Recipient phone number (any format, will be normalized)
 * @param templateName - Name of the approved Meta template (e.g. "welcome_message")
 * @param language - Language code (e.g. "id" for Indonesian)
 * @param components - Array of template components with parameters
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  language: string = "id",
  components?: TemplateComponent[],
): Promise<KirimdevResponse> {
  const apiKey = getApiKey();
  const phoneNumberId = getPhoneNumberId();

  if (!apiKey) {
    return { success: false, error: "KIRIMDEV_API_KEY not configured" };
  }
  if (!phoneNumberId) {
    return { success: false, error: "KIRIMDEV_PHONE_NUMBER_ID not configured" };
  }
  if (!to || !templateName) {
    return { success: false, error: "Recipient and template name are required" };
  }

  const normalizedTo = normalizePhone(to);
  if (!isValidPhone(normalizedTo)) {
    return { success: false, error: `Invalid phone number: ${to}` };
  }

  try {
    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      to: normalizedTo,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
      },
    };

    if (components && components.length > 0) {
      (body.template as Record<string, unknown>).components = components;
    }

    const response = await fetch(
      `${KIRIMDEV_API_BASE}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const result = (await response.json()) as
      | KirimdevSuccessResponse
      | KirimdevErrorResponse;

    if (!response.ok) {
      const err = result as KirimdevErrorResponse;
      console.error("[KIRIMDEV] Send template failed:", {
        to: normalizedTo,
        template: templateName,
        error: err.error,
      });
      return {
        success: false,
        error: err.error?.message || "Unknown error",
        code: err.error?.code,
        request_id: err.error?.request_id,
      };
    }

    const successResult = result as KirimdevSuccessResponse;
    console.log("[KIRIMDEV] Template sent:", {
      to: normalizedTo,
      template: templateName,
      messageId: successResult.data.id,
      status: successResult.data.status,
    });

    return {
      success: true,
      data: successResult.data,
      request_id: successResult.request_id,
    };
  } catch (error) {
    console.error("[KIRIMDEV] Network error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
