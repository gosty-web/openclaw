import { getGlobalDb } from "../../infra/db.js";
import type { GatewayRequestHandlers } from "./types.js";

export const missionControlHandlers: GatewayRequestHandlers = {
  "mission_control.get_data": async ({ respond }) => {
    const db = getGlobalDb();

    const tasks = db.prepare(`SELECT * FROM mission_tasks ORDER BY created_at DESC LIMIT 50`).all();
    const intel = db.prepare(`SELECT * FROM user_intelligence_memory ORDER BY confidence_score DESC LIMIT 10`).all();
    const audit = db.prepare(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 20`).all();
    const scheduled = db.prepare(`SELECT * FROM scheduled_tasks WHERE status = 'active' ORDER BY next_run_at ASC`).all();

    respond(true, {
      tasks,
      intel,
      audit,
      scheduled
    });
  },

  "mission_control.get_stats": async ({ respond }) => {
    const db = getGlobalDb();

    const taskStats = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM mission_tasks
      GROUP BY status
    `).all();

    // Sum tokens from audit_log diff column
    const tokenResult = db.prepare(`
      SELECT SUM(CAST(json_extract(diff, '$.tokens') AS INTEGER)) as total
      FROM audit_log
      WHERE action = 'token_usage'
    `).get() as { total: number } | undefined;

    const tokens = tokenResult?.total || 0;
    const cost = tokens * 0.00001;

    const agentStats = { online: 5, busy: 2 };

    respond(true, {
      taskStats,
      agentStats,
      tokens,
      cost,
      heartbeat: '1m 45s'
    });
  }
};
