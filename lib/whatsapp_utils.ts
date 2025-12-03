// Helper to extract clean button/list IDs
export function extractButtonId(message: any): string | null {
  const result = message.reply?.buttons_reply?.id || null;
  return result;
}

export function extractListId(message: any): string | null {
  const id = message.reply?.list_reply?.id || null;
  // Whapi.cloud prefixes list IDs with "ListV3:" - strip it
  if (id && id.startsWith("ListV3:")) {
    return id.replace("ListV3:", "");
  }
  return id;
}

export function extractTextInput(message: any): string | null {
  const result = message.text?.body?.trim() || null;
  return result;
}
