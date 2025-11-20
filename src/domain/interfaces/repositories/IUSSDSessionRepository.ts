/**
 * USSD Session Repository Interface
 *
 * Handles persistence and retrieval of USSD session data
 * with TTL (Time To Live) support for automatic expiration.
 *
 * Implementation: Redis-based (Upstash) for production scalability
 */

/**
 * USSD Session Data Structure
 */
export interface USSDSession {
  sessionId: string; // From Africa's Talking/Twilio
  phoneNumber: string;
  officerId?: string; // Set after authentication
  currentMenu: string; // Current menu state
  data: Record<string, any>; // Menu-specific data
  lastActivity: Date;
  createdAt: Date;
}

/**
 * USSD Session Repository Interface
 */
export interface IUSSDSessionRepository {
  /**
   * Save or update session with TTL
   * @param sessionId Unique session identifier from USSD gateway
   * @param data Session data to store
   * @param ttlSeconds Time to live in seconds (default: 180 = 3 minutes)
   */
  save(
    sessionId: string,
    data: Partial<Omit<USSDSession, "sessionId" | "createdAt">>,
    ttlSeconds?: number
  ): Promise<void>;

  /**
   * Get session by ID
   * @param sessionId Session identifier
   * @returns Session data or null if not found/expired
   */
  get(sessionId: string): Promise<USSDSession | null>;

  /**
   * Update session with partial data
   * @param sessionId Session identifier
   * @param updates Partial session data to merge
   */
  update(
    sessionId: string,
    updates: Partial<Omit<USSDSession, "sessionId" | "createdAt">>
  ): Promise<void>;

  /**
   * Delete session immediately
   * @param sessionId Session identifier
   */
  delete(sessionId: string): Promise<void>;

  /**
   * Check if session exists
   * @param sessionId Session identifier
   */
  exists(sessionId: string): Promise<boolean>;

  /**
   * Set officer ID after authentication
   * @param sessionId Session identifier
   * @param officerId Officer ID from database
   * @param officerData Optional additional officer data
   */
  authenticateSession(
    sessionId: string,
    officerId: string,
    officerData?: Record<string, any>
  ): Promise<void>;

  /**
   * Get officer ID from session
   * @param sessionId Session identifier
   * @returns Officer ID or null if not authenticated
   */
  getOfficerId(sessionId: string): Promise<string | null>;

  /**
   * Check if session is authenticated
   * @param sessionId Session identifier
   */
  isAuthenticated(sessionId: string): Promise<boolean>;

  /**
   * Store arbitrary data in session
   * @param sessionId Session identifier
   * @param key Data key
   * @param value Data value
   */
  setData(sessionId: string, key: string, value: any): Promise<void>;

  /**
   * Retrieve arbitrary data from session
   * @param sessionId Session identifier
   * @param key Data key
   * @returns Data value or undefined if not found
   */
  getData(sessionId: string, key: string): Promise<any>;

  /**
   * Get total number of active sessions (for monitoring)
   */
  getActiveSessionCount(): Promise<number>;
}
