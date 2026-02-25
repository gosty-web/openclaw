import crypto from "node:crypto";
import { Type } from "@sinclair/typebox";
import { getGlobalDb } from "../../infra/db.js";
import { CronEngine } from "../../infra/cron-engine.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

const ScheduleTaskSchema = Type.Object({
  cronExpression: Type.Optional(Type.String()),
  naturalLanguageSchedule: Type.Optional(Type.String()),
  description: Type.String(),
  ownerAgentId: Type.Optional(Type.String()),
});

export function createScheduleTaskTool(): AnyAgentTool {
  return {
    label: "Schedule Task",
    name: "schedule_task",
    description: "Schedules a recurring task for an agent.",
    parameters: ScheduleTaskSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const cronExpression = readStringParam(params, "cronExpression");
      const naturalLanguageSchedule = readStringParam(params, "naturalLanguageSchedule");
      const description = readStringParam(params, "description", { required: true });
      const ownerAgentId = readStringParam(params, "ownerAgentId") || "main";

      if (!cronExpression && !naturalLanguageSchedule) {
        return jsonResult({ status: "error", error: "Provide either cronExpression or naturalLanguageSchedule" });
      }

      const db = getGlobalDb();
      const cronEngine = new CronEngine(db);

      const effectiveCron = cronExpression || "0 9 * * *"; // Mock: convert NL to cron if needed
      const nextRunAt = cronEngine.calculateNextRun(effectiveCron);

      const taskId = crypto.randomUUID();
      const now = Date.now();

      db.prepare(`
        INSERT INTO scheduled_tasks (
          id, owner_agent_id, cron_expression, natural_language_schedule, task_payload, status, next_run_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        taskId,
        ownerAgentId,
        effectiveCron,
        naturalLanguageSchedule || null,
        JSON.stringify({ description }),
        "active",
        nextRunAt,
        now,
        now
      );

      return jsonResult({ status: "ok", taskId, nextRunAt });
    },
  };
}

export function createListScheduledTasksTool(): AnyAgentTool {
  return {
    label: "List Scheduled Tasks",
    name: "list_scheduled_tasks",
    description: "Lists all recurring tasks for the current workspace.",
    parameters: Type.Object({}),
    execute: async () => {
      const db = getGlobalDb();
      const rows = db.prepare(`SELECT * FROM scheduled_tasks`).all();
      return jsonResult({ tasks: rows });
    },
  };
}

export function createCancelScheduledTaskTool(): AnyAgentTool {
  return {
    label: "Cancel Scheduled Task",
    name: "cancel_scheduled_task",
    description: "Cancels a recurring task.",
    parameters: Type.Object({ taskId: Type.String() }),
    execute: async (_toolCallId, args) => {
      const { taskId } = args as { taskId: string };
      const db = getGlobalDb();
      db.prepare(`DELETE FROM scheduled_tasks WHERE id = ?`).run(taskId);
      return jsonResult({ status: "ok" });
    },
  };
}
