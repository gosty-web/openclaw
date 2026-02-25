import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("hive/decomposition");

export interface SubTask {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  assignedTo?: string;
  status: "pending" | "active" | "completed" | "failed";
}

export interface TaskGraph {
  goal: string;
  tasks: SubTask[];
}

import { callGateway } from "../gateway/call.js";

export class GoalDecompositionEngine {
  /**
   * Decomposes a high-level goal into a graph of sub-tasks using an LLM.
   */
  async decompose(goal: string): Promise<TaskGraph> {
    log.info(`Decomposing goal: ${goal}`);

    const prompt = `Decompose the following goal into a list of sub-tasks with dependencies.
Goal: ${goal}

Return a JSON object with this structure:
{
  "goal": "${goal}",
  "tasks": [
    { "id": "task-id", "title": "...", "description": "...", "dependencies": ["other-task-id"] }
  ]
}
Respond ONLY with JSON.`;

    const response = await callGateway<{ text: string }>({
      method: "agent",
      params: {
        message: prompt,
        lane: "main",
        deliver: false,
        timeout: 30
      },
      timeoutMs: 60000
    });

    try {
        const jsonText = response?.text?.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(jsonText || "{}");
        return {
            goal: parsed.goal || goal,
            tasks: (parsed.tasks || []).map((t: any) => ({ ...t, status: "pending" }))
        };
    } catch (err) {
        log.error("Failed to parse decomposition result", err);
        return { goal, tasks: [] };
    }
  }

  resolveExecutionOrder(graph: TaskGraph): SubTask[][] {
    // Basic topological sort to determine tiers of execution
    const tiers: SubTask[][] = [];
    const completed = new Set<string>();
    let remaining = [...graph.tasks];

    while (remaining.length > 0) {
      const currentTier = remaining.filter(t =>
        t.dependencies.every(d => completed.has(d))
      );

      if (currentTier.length === 0) {
        log.error("Circular dependency detected in task graph!");
        break;
      }

      tiers.push(currentTier);
      currentTier.forEach(t => completed.add(t.id));
      remaining = remaining.filter(t => !completed.has(t.id));
    }

    return tiers;
  }
}
