import { createSubsystemLogger } from "../logging/subsystem.js";
import * as vm from "node:vm";

const log = createSubsystemLogger("forge/sandbox");

export interface TestResult {
  success: boolean;
  output?: string;
  error?: string;
}

export class SandboxTester {
  async testSkill(code: string): Promise<TestResult> {
    log.info("Testing skill in sandbox...");

    const context = {
      console: {
        log: (...args: any[]) => log.debug(`[sandbox] ${args.join(" ")}`),
        error: (...args: any[]) => log.error(`[sandbox] ${args.join(" ")}`),
      },
      process: {
        env: {}, // Empty env for isolation
      },
    };

    vm.createContext(context);

    try {
      const script = new vm.Script(code);
      // Basic validation: just check if it runs.
      // In a real scenario, we'd run specific test cases.
      script.runInContext(context, { timeout: 1000 });

      return { success: true, output: "Skill code executed without errors." };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.warn(`Sandbox test failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}
