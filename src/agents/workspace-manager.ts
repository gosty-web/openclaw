import fs from "node:fs/promises";
import path from "node:path";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { getGlobalDb } from "../infra/db.js";

const log = createSubsystemLogger("agents/workspace");

export interface WorkspaceConfig {
  id: string;
  name: string;
  rootPath: string;
  permissions: Record<string, boolean>;
}

export class WorkspaceManager {
  private db = getGlobalDb();

  async createWorkspace(name: string): Promise<WorkspaceConfig> {
    const id = crypto.randomUUID();
    const rootPath = `./workspaces/${id}`;

    log.info(`Creating workspace '${name}' at ${rootPath}`);
    await fs.mkdir(rootPath, { recursive: true });

    const config: WorkspaceConfig = {
      id,
      name,
      rootPath,
      permissions: {
        "allow_web_search": true,
        "allow_coding": true,
        "allow_telephony": false
      }
    };

    this.db.prepare(`
      INSERT INTO workspaces (id, name, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, JSON.stringify(config), Date.now(), Date.now());

    return config;
  }

  async cloneWorkspace(sourceId: string, newName: string): Promise<WorkspaceConfig> {
    const source = await this.getWorkspace(sourceId);
    if (!source) throw new Error(`Source workspace ${sourceId} not found`);

    const target = await this.createWorkspace(newName);
    log.info(`Cloning workspace ${sourceId} to ${target.id}`);

    // Recursive copy logic would go here
    // await fs.cp(source.rootPath, target.rootPath, { recursive: true });

    return target;
  }

  async getWorkspace(id: string): Promise<WorkspaceConfig | null> {
    const row = this.db.prepare(`SELECT config FROM workspaces WHERE id = ?`).get(id) as { config: string } | undefined;
    return row ? JSON.parse(row.config) : null;
  }

  async setPermissions(id: string, permissions: Record<string, boolean>) {
    const config = await this.getWorkspace(id);
    if (!config) throw new Error(`Workspace ${id} not found`);

    config.permissions = { ...config.permissions, ...permissions };
    this.db.prepare(`
      UPDATE workspaces
      SET config = ?, updated_at = ?
      WHERE id = ?
    `).run(JSON.stringify(config), Date.now(), id);
  }
}
