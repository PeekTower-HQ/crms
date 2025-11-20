/**
 * USSD Session Repository Implementation
 *
 * Redis-based session storage with fallback to in-memory for development.
 * Uses Upstash Redis REST API for production (serverless-compatible).
 *
 * Features:
 * - Automatic TTL (3 minutes default for USSD standard)
 * - Horizontal scalability (Redis cluster support)
 * - Serverless-friendly (no persistent connections)
 * - Development fallback (in-memory Map)
 */

import { Redis } from "@upstash/redis";
import {
  IUSSDSessionRepository,
  USSDSession,
} from "@/src/domain/interfaces/repositories/IUSSDSessionRepository";

/**
 * USSD Session Repository Implementation
 */
export class USSDSessionRepository implements IUSSDSessionRepository {
  private redis: Redis | null = null;
  private inMemoryStore: Map<string, USSDSession> = new Map();
  private readonly DEFAULT_TTL = 180; // 3 minutes (USSD standard)
  private useRedis: boolean = false;

  constructor() {
    // Initialize Redis if credentials are available
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (redisUrl && redisToken) {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        this.useRedis = true;
        console.log("[USSDSessionRepository] Using Redis (Upstash) for session storage");
      } else {
        console.warn(
          "[USSDSessionRepository] Redis credentials not found. Using in-memory storage (NOT RECOMMENDED FOR PRODUCTION)"
        );
      }
    } catch (error) {
      console.error("[USSDSessionRepository] Failed to initialize Redis:", error);
      console.warn("[USSDSessionRepository] Falling back to in-memory storage");
    }

    // Start periodic cleanup for in-memory store
    if (!this.useRedis) {
      this.startInMemoryCleanup();
    }
  }

  /**
   * Save or update session
   */
  async save(
    sessionId: string,
    data: Partial<Omit<USSDSession, "sessionId" | "createdAt">>,
    ttlSeconds: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      // Get existing session if it exists
      const existing = await this.get(sessionId);

      const session: USSDSession = {
        sessionId,
        phoneNumber: data.phoneNumber || existing?.phoneNumber || "",
        officerId: data.officerId || existing?.officerId,
        currentMenu: data.currentMenu || existing?.currentMenu || "main",
        data: data.data || existing?.data || {},
        lastActivity: new Date(),
        createdAt: existing?.createdAt || new Date(),
      };

      if (this.useRedis && this.redis) {
        // Redis storage
        const key = this.getRedisKey(sessionId);
        await this.redis.setex(key, ttlSeconds, JSON.stringify(session));
      } else {
        // In-memory storage
        this.inMemoryStore.set(sessionId, session);
      }
    } catch (error) {
      console.error(`[USSDSessionRepository] Error saving session ${sessionId}:`, error);
      throw new Error("Failed to save USSD session");
    }
  }

  /**
   * Get session by ID
   */
  async get(sessionId: string): Promise<USSDSession | null> {
    try {
      if (this.useRedis && this.redis) {
        // Redis retrieval
        const key = this.getRedisKey(sessionId);
        const data = await this.redis.get<string>(key);

        if (!data) {
          return null;
        }

        const session = JSON.parse(data) as USSDSession;
        // Convert string dates back to Date objects
        session.lastActivity = new Date(session.lastActivity);
        session.createdAt = new Date(session.createdAt);
        return session;
      } else {
        // In-memory retrieval with TTL check
        const session = this.inMemoryStore.get(sessionId);

        if (!session) {
          return null;
        }

        // Check if session has expired
        const age = Date.now() - session.lastActivity.getTime();
        if (age > this.DEFAULT_TTL * 1000) {
          this.inMemoryStore.delete(sessionId);
          return null;
        }

        return session;
      }
    } catch (error) {
      console.error(`[USSDSessionRepository] Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Update session with partial data
   */
  async update(
    sessionId: string,
    updates: Partial<Omit<USSDSession, "sessionId" | "createdAt">>
  ): Promise<void> {
    const existing = await this.get(sessionId);

    if (!existing) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await this.save(sessionId, {
      ...existing,
      ...updates,
    });
  }

  /**
   * Delete session
   */
  async delete(sessionId: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        const key = this.getRedisKey(sessionId);
        await this.redis.del(key);
      } else {
        this.inMemoryStore.delete(sessionId);
      }
    } catch (error) {
      console.error(`[USSDSessionRepository] Error deleting session ${sessionId}:`, error);
      // Don't throw - deletion failure shouldn't break flow
    }
  }

  /**
   * Check if session exists
   */
  async exists(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId);
    return session !== null;
  }

  /**
   * Set officer ID after authentication
   */
  async authenticateSession(
    sessionId: string,
    officerId: string,
    officerData?: Record<string, any>
  ): Promise<void> {
    const session = await this.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await this.update(sessionId, {
      officerId,
      data: {
        ...session.data,
        officer: officerData,
      },
    });
  }

  /**
   * Get officer ID from session
   */
  async getOfficerId(sessionId: string): Promise<string | null> {
    const session = await this.get(sessionId);
    return session?.officerId || null;
  }

  /**
   * Check if session is authenticated
   */
  async isAuthenticated(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId);
    return !!session?.officerId;
  }

  /**
   * Store data in session
   */
  async setData(sessionId: string, key: string, value: any): Promise<void> {
    const session = await this.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await this.update(sessionId, {
      data: {
        ...session.data,
        [key]: value,
      },
    });
  }

  /**
   * Get data from session
   */
  async getData(sessionId: string, key: string): Promise<any> {
    const session = await this.get(sessionId);
    return session?.data?.[key];
  }

  /**
   * Get active session count
   */
  async getActiveSessionCount(): Promise<number> {
    try {
      if (this.useRedis && this.redis) {
        // Count keys matching pattern
        const pattern = this.getRedisKey("*");
        const keys = await this.redis.keys(pattern);
        return keys.length;
      } else {
        // Clean expired sessions first
        this.cleanExpiredSessions();
        return this.inMemoryStore.size;
      }
    } catch (error) {
      console.error("[USSDSessionRepository] Error getting session count:", error);
      return 0;
    }
  }

  /**
   * Get Redis key with prefix
   */
  private getRedisKey(sessionId: string): string {
    return `ussd:session:${sessionId}`;
  }

  /**
   * Clean expired sessions from in-memory store
   */
  private cleanExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.inMemoryStore.entries()) {
      const age = now - session.lastActivity.getTime();
      if (age > this.DEFAULT_TTL * 1000) {
        this.inMemoryStore.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Start periodic cleanup for in-memory store (every 5 minutes)
   */
  private startInMemoryCleanup(): void {
    setInterval(() => {
      const cleaned = this.cleanExpiredSessions();
      if (cleaned > 0) {
        console.log(`[USSDSessionRepository] Cleaned up ${cleaned} expired sessions`);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}
