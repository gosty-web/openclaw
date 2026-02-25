import crypto from "node:crypto";
import { getGlobalDb } from "../infra/db.js";
import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("intelligence/extractor");

export class IntelligenceExtractor {
  static async extract(params: {
    userId: string;
    message: string;
  }): Promise<void> {
    const { userId, message } = params;
    const db = getGlobalDb();

    // Simple rule-based extraction for habits and preferences.
    // In a real implementation, this could use an LLM call.

    if (message.toLowerCase().includes("i like concise")) {
      await this.upsertMemory(db, userId, "preference", "response_style", "concise");
    }

    if (message.toLowerCase().includes("every morning")) {
      await this.upsertMemory(db, userId, "habit", "morning_routine", "active");
    }
  }

  private static async upsertMemory(
    db: any,
    userId: string,
    category: string,
    key: string,
    value: string
  ) {
    const now = Date.now();
    const existing = db.prepare(
      `SELECT * FROM user_intelligence_memory WHERE user_id = ? AND category = ? AND key = ?`
    ).get(userId, category, key);

    if (existing) {
      const newConfidence = Math.min(1, existing.confidence_score + 0.1);
      db.prepare(`
        UPDATE user_intelligence_memory
        SET value = ?, confidence_score = ?, last_observed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(value, newConfidence, now, now, existing.id);
      log.info(`Updated intelligence memory: ${key}=${value} (confidence: ${newConfidence})`);
    } else {
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO user_intelligence_memory (
          id, user_id, category, key, value, confidence_score, source, last_observed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, category, key, value, 0.5, "conversation", now, now, now);
      log.info(`Inserted new intelligence memory: ${key}=${value}`);
    }
  }
}
