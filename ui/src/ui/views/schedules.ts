import { html, nothing } from "lit";
import type { AppViewState } from "../app-view-state.ts";

export function renderSchedules(state: AppViewState) {
  const scheduled = state.missionControlData?.scheduled || [];

  return html`
    <div class="p-6">
      <header class="mb-8">
        <h1 class="text-2xl font-bold">Schedules & Routines</h1>
        <p class="text-muted-foreground">Heartbeats, crons, and proactive scheduled tasks</p>
      </header>

      <div class="grid grid-cols-3 gap-6">
        <section class="col-span-2 card p-6">
          <div class="flex justify-between items-center mb-6">
             <h2 class="text-lg font-bold">Planned Executions</h2>
             <div class="flex gap-2">
                <button class="btn btn-sm" disabled>Weekly View</button>
             </div>
          </div>

          <div class="overflow-y-auto max-h-[500px]">
             <table class="w-full text-sm text-left">
                <thead class="text-xs text-muted-foreground uppercase border-b">
                   <tr>
                      <th class="px-4 py-2">Task</th>
                      <th class="px-4 py-2">Schedule</th>
                      <th class="px-4 py-2">Next Run</th>
                      <th class="px-4 py-2">Status</th>
                   </tr>
                </thead>
                <tbody>
                   ${scheduled.map((task: any) => html`
                      <tr class="border-b border-border">
                         <td class="px-4 py-3 font-medium">${task.id}</td>
                         <td class="px-4 py-3 text-xs">${task.cron_expression || task.natural_language_schedule}</td>
                         <td class="px-4 py-3 text-xs">${task.next_run_at ? new Date(task.next_run_at).toLocaleString() : 'Pending'}</td>
                         <td class="px-4 py-3">
                            <span class="px-2 py-0.5 rounded-full text-[10px] bg-green-500/10 text-green-500 uppercase font-bold">
                               ${task.status}
                            </span>
                         </td>
                      </tr>
                   `)}
                   ${scheduled.length === 0 ? html`<tr><td colspan="4" class="text-center py-8 text-muted-foreground">No active scheduled tasks.</td></tr>` : nothing}
                </tbody>
             </table>
          </div>
        </section>

        <section class="card p-4">
           <h2 class="font-bold mb-4 text-lg">Timeline Queue</h2>
           <div class="space-y-3">
              ${scheduled.slice(0, 5).map((task: any) => html`
                <div class="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded">
                   <div class="text-sm font-semibold">${task.id}</div>
                   <div class="text-xs text-muted-foreground">Next: ${task.next_run_at ? new Date(task.next_run_at).toLocaleTimeString() : 'TBD'}</div>
                </div>
              `)}
              ${scheduled.length === 0 ? html`<div class="text-xs text-muted-foreground italic text-center py-4">Queue empty</div>` : nothing}

              <div class="p-3 bg-secondary rounded opacity-60">
                 <div class="text-sm font-semibold">System Heartbeat</div>
                 <div class="text-xs text-muted-foreground">Recurring every 5m</div>
              </div>
           </div>
        </section>
      </div>
    </div>
  `;
}
