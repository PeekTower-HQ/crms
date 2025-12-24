/**
 * Whapi.cloud WhatsApp API Client
 *
 * Handles sending messages via Whapi.cloud WhatsApp Business API.
 * Includes proper error handling, logging, and retry logic.
 */

/**
 * Fetch an image from a URL and convert it to base64 data URI
 * @param imageUrl - Public URL of the image
 * @returns Base64 data URI (e.g., "data:image/jpeg;base64,...")
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`[Whapi] Fetching image from URL: ${imageUrl.substring(0, 50)}...`);

    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get the image as an ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get content type from response header or default to jpeg
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Convert to base64
    const base64 = buffer.toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;

    console.log(`[Whapi] Image converted to base64 (${buffer.length} bytes, ${contentType})`);

    return dataUri;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Whapi] Failed to fetch and convert image: ${errorMessage}`);
    throw new Error(`Failed to convert image URL to base64: ${errorMessage}`);
  }
}

const whapiUrl = process.env.WHAPI_URL;
const whapiToken = process.env.WHAPI_TOKEN;
const whapiImageUrl = `${whapiUrl}/messages/image`;
const whapiTextUrl = `${whapiUrl}/messages/text`;
const whapiButtonUrl = `${whapiUrl}/messages/interactive`;
const whapiNewsletterUrl = `${whapiUrl}/newsletters`;

/**
 * Result of a Whapi API call
 */
interface WhapiResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Newsletter API result type (extends WhapiResult)
 */
interface WhapiNewsletterResult extends WhapiResult {
  newsletter?: {
    id: string;
    name: string;
    description?: string;
    picture?: string;
    subscribers?: number;
  };
}

interface WhapiNewsletterListResult extends WhapiResult {
  newsletters?: Array<{
    id: string;
    name: string;
    description?: string;
    picture?: string;
    subscribers?: number;
  }>;
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
        // Properly serialize error data
        if (typeof errorData === 'string') {
          errorText = errorData;
        } else if (errorData.message && typeof errorData.message === 'string') {
          errorText = errorData.message;
        } else if (errorData.error) {
          errorText = typeof errorData.error === 'string'
            ? errorData.error
            : JSON.stringify(errorData.error);
        } else {
          errorText = JSON.stringify(errorData);
        }
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

// ==================== NEWSLETTER/CHANNEL FUNCTIONS ====================

/**
 * Create a new WhatsApp Newsletter/Channel
 *
 * @param name - Newsletter name (required)
 * @param description - Newsletter description (optional)
 * @param pictureUrl - Newsletter profile picture URL (optional)
 * @returns WhapiNewsletterResult with newsletter ID
 */
export async function createNewsletter(
  name: string,
  description?: string,
  pictureUrl?: string
): Promise<WhapiNewsletterResult> {
  console.log("[Whapi] createNewsletter called with:", {
    name,
    description,
    pictureUrl: pictureUrl ? `${pictureUrl.substring(0, 50)}...` : undefined,
  });

  const payload: Record<string, unknown> = {
    name,
  };

  if (description) {
    payload.description = description;
  }

  if (pictureUrl) {
    // Convert URL to base64 if it's an HTTP(S) URL
    if (pictureUrl.startsWith('http://') || pictureUrl.startsWith('https://')) {
      console.log("[Whapi] Converting image URL to base64...");
      const base64Image = await fetchImageAsBase64(pictureUrl);
      payload.newsletter_pic = base64Image;
    } else if (pictureUrl.startsWith('data:')) {
      // Already base64, use as is
      console.log("[Whapi] Image already in base64 format");
      payload.newsletter_pic = pictureUrl;
    } else {
      throw new Error("Invalid picture URL: must be an HTTP(S) URL or base64 data URI");
    }
  }

  console.log("[Whapi] createNewsletter payload:", {
    ...payload,
    newsletter_pic: payload.newsletter_pic ? `${String(payload.newsletter_pic).substring(0, 50)}...` : undefined,
  });

  return sendNewsletterRequest(
    whapiNewsletterUrl,
    "POST",
    payload,
    "create newsletter"
  );
}

/**
 * List all WhatsApp Newsletters
 *
 * @param count - Maximum number of newsletters to fetch (default: 100)
 * @returns WhapiNewsletterListResult with newsletters array
 */
export async function listNewsletters(
  count: number = 100
): Promise<WhapiNewsletterListResult> {
  const url = `${whapiNewsletterUrl}?count=${count}`;

  return sendNewsletterRequest(url, "GET", null, "list newsletters");
}

/**
 * Get a specific WhatsApp Newsletter by ID
 *
 * @param id - Newsletter ID (format: "id@newsletter")
 * @returns WhapiNewsletterResult with newsletter details
 */
export async function getNewsletter(
  id: string
): Promise<WhapiNewsletterResult> {
  const url = `${whapiNewsletterUrl}/${encodeURIComponent(id)}`;

  return sendNewsletterRequest(url, "GET", null, "get newsletter");
}

/**
 * Update a WhatsApp Newsletter
 *
 * @param id - Newsletter ID (format: "id@newsletter")
 * @param updates - Fields to update
 * @returns WhapiNewsletterResult with updated newsletter
 */
export async function updateNewsletter(
  id: string,
  updates: {
    name?: string;
    description?: string;
    pictureUrl?: string;
    reactions?: boolean;
  }
): Promise<WhapiNewsletterResult> {
  const payload: Record<string, unknown> = {};

  if (updates.name !== undefined) {
    payload.name = updates.name;
  }

  if (updates.description !== undefined) {
    payload.description = updates.description;
  }

  if (updates.pictureUrl !== undefined) {
    // Convert URL to base64 if it's an HTTP(S) URL
    if (updates.pictureUrl.startsWith('http://') || updates.pictureUrl.startsWith('https://')) {
      console.log("[Whapi] Converting image URL to base64...");
      const base64Image = await fetchImageAsBase64(updates.pictureUrl);
      payload.newsletter_pic = base64Image;
    } else if (updates.pictureUrl.startsWith('data:')) {
      // Already base64, use as is
      console.log("[Whapi] Image already in base64 format");
      payload.newsletter_pic = updates.pictureUrl;
    } else {
      throw new Error("Invalid picture URL: must be an HTTP(S) URL or base64 data URI");
    }
  }

  if (updates.reactions !== undefined) {
    payload.reactions = updates.reactions ? "all" : "none";
  }

  const url = `${whapiNewsletterUrl}/${encodeURIComponent(id)}`;

  return sendNewsletterRequest(url, "PATCH", payload, "update newsletter");
}

/**
 * Delete a WhatsApp Newsletter
 *
 * @param id - Newsletter ID (format: "id@newsletter")
 * @returns WhapiResult
 */
export async function deleteNewsletter(id: string): Promise<WhapiResult> {
  const url = `${whapiNewsletterUrl}/${encodeURIComponent(id)}`;

  return sendNewsletterRequest(url, "DELETE", null, "delete newsletter");
}

/**
 * Send a message to a WhatsApp Newsletter/Channel
 *
 * @param newsletterId - Newsletter ID (format: "id@newsletter")
 * @param message - Text message to broadcast
 * @returns WhapiResult with message ID
 */
export async function sendNewsletterMessage(
  newsletterId: string,
  message: string
): Promise<WhapiResult> {
  // Ensure newsletterId has @newsletter suffix
  const to = newsletterId.includes("@newsletter")
    ? newsletterId
    : `${newsletterId}@newsletter`;

  const payload = {
    to,
    body: message,
  };

  return sendRequest(whapiTextUrl, payload, "newsletter message");
}

/**
 * Send a link preview message to a WhatsApp Newsletter/Channel
 *
 * Uses Whapi's /messages/link_preview endpoint for rich previews
 * Body MUST contain at least one URL for the preview to work
 *
 * @param newsletterId - Newsletter ID (format: "id@newsletter")
 * @param body - Message body containing at least one URL (required)
 * @param title - Preview title (optional)
 * @param media - Image URL for preview (optional)
 * @returns WhapiResult with message ID
 */
export async function sendNewsletterLinkPreview(
  newsletterId: string,
  body: string,
  title?: string,
  media?: string
): Promise<WhapiResult> {
  // Validate body contains URL
  if (!body || body.trim().length === 0) {
    return {
      success: false,
      error: "Body text is required for link preview messages",
    };
  }

  // Simple URL detection
  if (!body.match(/https?:\/\//i)) {
    return {
      success: false,
      error: "Body text must contain at least one URL for link preview",
    };
  }

  // Ensure newsletterId has @newsletter suffix
  const to = newsletterId.includes("@newsletter")
    ? newsletterId
    : `${newsletterId}@newsletter`;

  // Build payload
  const payload: Record<string, unknown> = {
    to,
    body, // Required, must contain URL
  };

  // Add optional fields
  if (title && title.trim().length > 0) {
    payload.title = title;
  }

  if (media && media.trim().length > 0) {
    payload.media = media;
  }

  // Use link_preview endpoint
  const linkPreviewUrl = `${whapiUrl}/messages/link_preview`;

  return sendRequest(linkPreviewUrl, payload, "newsletter link preview");
}

/**
 * Internal helper for newsletter API requests
 * Handles GET, POST, PATCH, DELETE methods with retry logic
 */
async function sendNewsletterRequest(
  url: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  payload: Record<string, unknown> | null,
  operationType: string,
  retries: number = 2
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // Validate configuration
  if (!whapiUrl || !whapiToken) {
    const error =
      "[Whapi] Missing WHAPI_URL or WHAPI_TOKEN environment variable";
    console.error(error);
    return { success: false, error };
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${whapiToken}`,
        },
      };

      if (payload && (method === "POST" || method === "PATCH")) {
        options.body = JSON.stringify(payload);
      }

      // Debug logging
      console.log(`[Whapi] ${operationType} request:`, {
        url,
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${whapiToken?.substring(0, 10)}...`,
        },
        payload: payload ? {
          ...payload,
          newsletter_pic: payload.newsletter_pic ? `${String(payload.newsletter_pic).substring(0, 50)}...` : undefined,
        } : null,
        bodyLength: options.body ? (typeof options.body === 'string' ? options.body.length : 'N/A') : 0,
      });

      const response = await fetch(url, options);

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log(`[Whapi] ${operationType} successful`);

        // Transform response to our standard format
        if (method === "GET" && Array.isArray(data.newsletters)) {
          return {
            success: true,
            newsletters: data.newsletters,
          };
        } else if (data.id) {
          return {
            success: true,
            newsletter: {
              id: data.id,
              name: data.name,
              description: data.description,
              picture: data.picture,
              subscribers: data.subscribers,
            },
          };
        }

        return { success: true, ...data };
      }

      // Handle errors
      const statusCode = response.status;
      let errorText: string;

      try {
        const errorData = await response.json();
        // Properly serialize error data
        if (typeof errorData === 'string') {
          errorText = errorData;
        } else if (errorData.message && typeof errorData.message === 'string') {
          errorText = errorData.message;
        } else if (errorData.error) {
          errorText = typeof errorData.error === 'string'
            ? errorData.error
            : JSON.stringify(errorData.error);
        } else {
          errorText = JSON.stringify(errorData);
        }
      } catch {
        errorText = response.statusText;
      }

      console.error(
        `[Whapi] ${operationType} failed (${statusCode}): ${errorText}`,
        { attempt: attempt + 1 }
      );

      // Don't retry on client errors (4xx)
      if (statusCode >= 400 && statusCode < 500) {
        return {
          success: false,
          error: `Client error (${statusCode}): ${errorText}`,
        };
      }

      // Retry on server errors (5xx)
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500;
        console.log(`[Whapi] Retrying ${operationType} in ${delay}ms...`);
        await sleep(delay);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error(`[Whapi] ${operationType} error:`, {
        error: errorMessage,
        attempt: attempt + 1,
      });

      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500;
        console.log(`[Whapi] Retrying ${operationType} in ${delay}ms...`);
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
