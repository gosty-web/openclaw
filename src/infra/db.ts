import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { resolveOpenClawAgentDir } from "../agents/agent-paths.js";
import { ensureGlobalSchema } from "./db-schema.js";

let db: DatabaseSync | null = null;

export function getGlobalDb(): DatabaseSync {
  if (db) {
    return db;
  }

  const agentDir = resolveOpenClawAgentDir();
  const dbPath = path.join(agentDir, "global.sqlite");

  db = new DatabaseSync(dbPath);
  ensureGlobalSchema(db);

  return db;
}
