/**
 * WhatsApp Service
 *
 * Main orchestrator for WhatsApp bot functionality.
 * Implements state machine for conversation flow management.
 *
 * Flow:
 * 1. Officer sends message -> Check phone registration
 * 2. Show main menu (NO PIN yet)
 * 3. Select query type -> Prompt for search term
 * 4. Enter search term -> Prompt for PIN
 * 5. Validate PIN -> Execute query -> Show result
 *
 * Pan-African Design:
 * - Works with WhatsApp Business API via Whapi.cloud
 * - Supports low-bandwidth environments
 * - Offline-resilient with session persistence
 */

import { container } from "@/src/di/container";
import * as whapi from "@/lib/whapi";
import {
  extractButtonId,
  extractListId,
  extractTextInput,
} from "@/lib/whatsapp_utils";
import {
  WhatsAppSession,
  WhatsAppSessionState,
  WhatsAppQueryType,
} from "@/src/domain/types/WhatsAppSession";
import {
  templates,
  validatePin,
  checkRateLimit,
  handleWantedPersonCheck,
  handleMissingPersonCheck,
  handleBackgroundCheck,
  handleVehicleCheck,
  handleStats,
  QueryHandlerParams,
} from "@/src/services/whatsapp_helpers";

/**
 * Input parsed from incoming WhatsApp message
 */
interface ParsedInput {
  type: "list" | "button" | "text";
  value: string | null;
}

/**
 * Main entry point for WhatsApp webhook
 */
export async function init(body: unknown): Promise<void> {
  const message = (body as Record<string, unknown>)?.messages as
    | Array<Record<string, unknown>>
    | undefined;
  const msg = message?.[0];

  if (!msg) {
    console.log("[WhatsAppService] No message in webhook body");
    return;
  }

  const phoneNumber = msg.from as string;
  const fromName = (msg.from_name as string) || "Officer";

  try {
    await handleMessage(phoneNumber, fromName, msg);
  } catch (error) {
    console.error("[WhatsAppService] Error handling message:", error);
    await sendErrorMessage(
      phoneNumber,
      "An unexpected error occurred. Please try again."
    );
  }
}

/**
 * Handle incoming WhatsApp message
 */
async function handleMessage(
  phoneNumber: string,
  fromName: string,
  message: Record<string, unknown>
): Promise<void> {
  const { whatsappSessionRepository, fieldCheckService } = container;

  // Step 1: Check if phone number is registered
  const officer = await fieldCheckService.findOfficerByPhone('+'+phoneNumber);

  if (!officer) {
    await whapi.sendTextMessage(
      phoneNumber,
      await templates.invalidPhoneNumberTemplate()
    );
    return;
  }

  // Step 2: Check if channel is enabled for officer
  const isEnabled = await fieldCheckService.isChannelEnabled(
    officer.id,
    "whatsapp"
  );
  if (!isEnabled) {
    await whapi.sendTextMessage(
      phoneNumber,
      "WhatsApp access is disabled for your account. Contact your administrator."
    );
    return;
  }

  // Step 3: Get or create session
  const session = await whatsappSessionRepository.getOrCreate(phoneNumber);

  console.log("session", session);

  // Step 4: Parse user input
  const input = parseInput(message);

  // Step 5: Route based on session state
  await routeByState(session, input, phoneNumber, fromName, officer.id);
}

/**
 * Parse input from WhatsApp message
 */
function parseInput(message: Record<string, unknown>): ParsedInput {
  const listId = extractListId(message);
  if (listId) {
    return { type: "list", value: listId };
  }

  const buttonId = extractButtonId(message);
  if (buttonId) {
    return { type: "button", value: buttonId };
  }

  const textInput = extractTextInput(message);
  return { type: "text", value: textInput };
}

/**
 * Route to appropriate handler based on session state
 */
async function routeByState(
  session: WhatsAppSession,
  input: ParsedInput,
  phoneNumber: string,
  fromName: string,
  officerId: string
): Promise<void> {
  const { whatsappSessionRepository } = container;

  switch (session.state) {
    case WhatsAppSessionState.MAIN_MENU:
      await handleMainMenu(input, phoneNumber, fromName);
      break;

    case WhatsAppSessionState.AWAITING_SEARCH:
      await handleAwaitingSearch(session, input, phoneNumber);
      break;

    case WhatsAppSessionState.AWAITING_PIN:
      await handleAwaitingPin(session, input, phoneNumber, officerId);
      break;

    case WhatsAppSessionState.RESULT_SENT:
      // Any message after result resets to main menu
      await whatsappSessionRepository.resetToMainMenu(phoneNumber);
      await sendMainMenu(phoneNumber, fromName);
      break;

    default:
      // Unknown state - reset to main menu
      await whatsappSessionRepository.resetToMainMenu(phoneNumber);
      await sendMainMenu(phoneNumber, fromName);
  }
}

/**
 * Handle MAIN_MENU state - show menu or process selection
 */
async function handleMainMenu(
  input: ParsedInput,
  phoneNumber: string,
  fromName: string
): Promise<void> {
  const { whatsappSessionRepository } = container;

  // Check if user selected a query type
  const queryType = input.value as WhatsAppQueryType | null;

  if (!queryType || !isValidQueryType(queryType)) {
    // No selection or invalid - show main menu
    await sendMainMenu(phoneNumber, fromName);
    return;
  }

  // Valid selection - update session with query type
  await whatsappSessionRepository.setQueryType(phoneNumber, queryType);

  // For stats, skip search term prompt - go directly to PIN
  if (queryType === WhatsAppQueryType.STATS) {
    await whapi.sendTextMessage(
      phoneNumber,
      await templates.pinPromptTemplate()
    );
    return;
  }

  // Send appropriate search prompt based on query type
  await sendSearchPrompt(phoneNumber, queryType);
}

/**
 * Handle AWAITING_SEARCH state - capture search term
 */
async function handleAwaitingSearch(
  session: WhatsAppSession,
  input: ParsedInput,
  phoneNumber: string
): Promise<void> {
  const { whatsappSessionRepository } = container;

  const searchTerm = input.value?.trim();

  if (!searchTerm) {
    // Re-prompt for search term
    await sendSearchPrompt(
      phoneNumber,
      session.selectedQueryType as WhatsAppQueryType
    );
    return;
  }

  // Store search term and transition to AWAITING_PIN
  await whatsappSessionRepository.setSearchTerm(phoneNumber, searchTerm);

  // Prompt for PIN
  await whapi.sendTextMessage(phoneNumber, await templates.pinPromptTemplate());
}

/**
 * Handle AWAITING_PIN state - validate PIN and execute query
 */
async function handleAwaitingPin(
  session: WhatsAppSession,
  input: ParsedInput,
  phoneNumber: string,
  officerId: string
): Promise<void> {
  const { whatsappSessionRepository } = container;

  const pin = input.value?.trim() || "";

  // Validate PIN using handler
  const pinResult = await validatePin(phoneNumber, officerId, pin);

  if (!pinResult.valid) {
    await whapi.sendTextMessage(phoneNumber, pinResult.error || "Invalid PIN");
    return;
  }

  // Check rate limit using handler
  const rateLimitResult = await checkRateLimit(officerId);

  if (!rateLimitResult.allowed) {
    await whatsappSessionRepository.resetToMainMenu(phoneNumber);
    await whapi.sendTextMessage(
      phoneNumber,
      rateLimitResult.error || "Rate limit exceeded"
    );
    return;
  }

  // Execute query based on type
  await executeQuery(session, phoneNumber, officerId);
}

/**
 * Execute the query based on session's query type
 */
async function executeQuery(
  session: WhatsAppSession,
  phoneNumber: string,
  officerId: string
): Promise<void> {
  const { whatsappSessionRepository } = container;
  const queryType = session.selectedQueryType as WhatsAppQueryType;
  const searchTerm = session.searchTerm || "";

  const params: QueryHandlerParams = {
    session,
    officerId,
    searchTerm,
  };

  let responseText: string;

  switch (queryType) {
    case WhatsAppQueryType.WANTED: {
      const result = await handleWantedPersonCheck(params);
      responseText = result.responseText;
      break;
    }

    case WhatsAppQueryType.MISSING: {
      const result = await handleMissingPersonCheck(params);
      responseText = result.responseText;
      break;
    }

    case WhatsAppQueryType.BACKGROUND: {
      const result = await handleBackgroundCheck(params);
      responseText = result.responseText;
      break;
    }

    case WhatsAppQueryType.VEHICLE: {
      const result = await handleVehicleCheck(params);
      responseText = result.responseText;
      break;
    }

    case WhatsAppQueryType.STATS: {
      const result = await handleStats(officerId);
      responseText = result.responseText;
      break;
    }

    default:
      responseText = await templates.errorTemplate("Unknown query type");
  }

  // Send result
  await whapi.sendTextMessage(phoneNumber, responseText);

  // Transition to RESULT_SENT
  await whatsappSessionRepository.transitionState(
    phoneNumber,
    WhatsAppSessionState.RESULT_SENT
  );
}

/**
 * Send main menu to user
 */
async function sendMainMenu(
  phoneNumber: string,
  fromName: string
): Promise<void> {
  const menu = await templates.mainMenuMessageTemplate(fromName, phoneNumber);
  await whapi.sendButtonMessage(menu);
}

/**
 * Send search prompt based on query type
 */
async function sendSearchPrompt(
  phoneNumber: string,
  queryType: WhatsAppQueryType
): Promise<void> {
  let promptText: string;

  switch (queryType) {
    case WhatsAppQueryType.WANTED:
      promptText = await templates.wantedPersonTemplate();
      break;
    case WhatsAppQueryType.MISSING:
      promptText = await templates.missingPersonTemplate();
      break;
    case WhatsAppQueryType.BACKGROUND:
      promptText = await templates.backgroundCheckTemplate();
      break;
    case WhatsAppQueryType.VEHICLE:
      promptText = await templates.vehicleCheckTemplate();
      break;
    default:
      promptText = "Enter your search term:";
  }

  await whapi.sendTextMessage(phoneNumber, promptText);
}

/**
 * Send error message to user
 */
async function sendErrorMessage(
  phoneNumber: string,
  message: string
): Promise<void> {
  await whapi.sendTextMessage(phoneNumber, await templates.errorTemplate(message));
}

/**
 * Check if value is a valid query type
 */
function isValidQueryType(value: string): value is WhatsAppQueryType {
  return Object.values(WhatsAppQueryType).includes(value as WhatsAppQueryType);
}
