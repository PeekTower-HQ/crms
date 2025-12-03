/**
 * Whapi.cloud WhatsApp API Client
 *
 * Handles sending messages via Whapi.cloud WhatsApp Business API.
 * Includes proper error handling, logging, and retry logic.
 */

const whapiUrl = process.env.WHAPI_URL;
const whapiToken = process.env.WHAPI_TOKEN;
const whapiImageUrl = `${whapiUrl}/messages/image`;
const whapiTextUrl = `${whapiUrl}/messages/text`;
const whapiButtonUrl = `${whapiUrl}/messages/interactive`;

/**
 * Result of a Whapi API call
 */
interface WhapiResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a text message via WhatsApp
 */
export async function sendTextMessage(
  phoneNumber: string,
  message: string
): Promise<WhapiResult> {
  const payload = {
    to: phoneNumber,
    typing_time: 2,
    body: message,
  };

  return sendRequest(whapiTextUrl, payload, "text");
}

/**
 * Send an image message via WhatsApp
 */
export async function sendImageMessage(
  phoneNumber: string,
  mediaUrl: string,
  caption?: string
): Promise<WhapiResult> {
  const payload = {
    to: phoneNumber,
    media: mediaUrl,
    caption: caption || "",
    typing_time: 2,
  };

  return sendRequest(whapiImageUrl, payload, "image");
}

/**
 * Send an interactive button message via WhatsApp
 */
export async function sendButtonMessage(
  payload: Record<string, unknown>
): Promise<WhapiResult> {
  return sendRequest(whapiButtonUrl, payload, "button");
}

/**
 * Internal helper to send requests with proper error handling
 */
async function sendRequest(
  url: string,
  payload: Record<string, unknown>,
  messageType: string,
  retries: number = 2
): Promise<WhapiResult> {
  // Validate configuration
  if (!whapiUrl || !whapiToken) {
    const error = "[Whapi] Missing WHAPI_URL or WHAPI_TOKEN environment variable";
    console.error(error);
    return { success: false, error };
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${whapiToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log(
          `[Whapi] ${messageType} message sent successfully to this ${payload.to}`
        );
        return {
          success: true,
          messageId: data.message_id || data.id,
        };
      }

      // Handle specific error codes
      const statusCode = response.status;
      let errorText: string;

      try {
        const errorData = await response.json();
        errorText = errorData.message || errorData.error || response.statusText;
      } catch {
        errorText = response.statusText;
      }

      // Log error with context
      console.error(
        `[Whapi] ${messageType} message failed (${statusCode}): ${errorText}`,
        { to: payload.to, attempt: attempt + 1 }
      );

      // Don't retry on client errors (4xx)
      if (statusCode >= 400 && statusCode < 500) {
        return {
          success: false,
          error: `Client error (${statusCode}): ${errorText}`,
        };
      }

      // For server errors (5xx), retry after delay
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500; // Exponential backoff: 500ms, 1000ms
        console.log(`[Whapi] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error(`[Whapi] ${messageType} message error:`, {
        to: payload.to,
        error: errorMessage,
        attempt: attempt + 1,
      });

      // Retry on network errors
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500;
        console.log(`[Whapi] Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        return {
          success: false,
          error: `Network error: ${errorMessage}`,
        };
      }
    }
  }

  return {
    success: false,
    error: "Max retries exceeded",
  };
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
