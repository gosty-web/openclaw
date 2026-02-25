import { html, nothing } from "lit";
import type { AppViewState } from "../app-view-state.ts";

export function renderMissionControl(state: AppViewState) {
  const stats = state.missionControlStats;
  const data = state.missionControlData;

  const taskStats = stats?.taskStats || [];
  const agentStats = stats?.agentStats || { online: 0, busy: 0 };

  const formatTokens = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  };

  // Status mapping to cover different naming conventions
  const getCount = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'pending') return taskStats.find(st => st.status === 'pending' || st.status === 'todo')?.count || 0;
    if (s === 'active') return taskStats.find(st => st.status === 'active' || st.status === 'in_progress')?.count || 0;
    if (s === 'completed') return taskStats.find(st => st.status === 'completed' || st.status === 'done')?.count || 0;
    return 0;
  };

  return html`
    <div class="mission-control-dashboard">
      <!-- Global Status Summary Panel -->
      <header class="status-summary grid grid-cols-4 gap-4 mb-6">
        <div class="card stat-card p-4">
          <div class="stat-label text-xs uppercase text-muted-foreground font-semibold">Tasks</div>
          <div class="stat-value text-2xl font-bold">
            ${getCount('pending')} / ${getCount('active')} / ${getCount('completed')}
          </div>
          <div class="stat-sub text-[10px] text-muted-foreground">Backlog / In Progress / Done</div>
        </div>
        <div class="card stat-card p-4">
          <div class="stat-label text-xs uppercase text-muted-foreground font-semibold">Agents</div>
          <div class="stat-value text-2xl font-bold">${agentStats.online} / ${agentStats.busy}</div>
          <div class="stat-sub text-[10px] text-muted-foreground">Online / Busy</div>
        </div>
        <div class="card stat-card p-4">
          <div class="stat-label text-xs uppercase text-muted-foreground font-semibold">Tokens Today</div>
          <div class="stat-value text-2xl font-bold">${formatTokens(stats?.tokens || 0)}</div>
          <div class="stat-sub text-[10px] text-muted-foreground">Est. Cost: $${(stats?.cost || 0).toFixed(2)}</div>
        </div>
        <div class="card stat-card p-4">
          <div class="stat-label text-xs uppercase text-muted-foreground font-semibold">Heartbeat</div>
          <div class="stat-value text-2xl font-bold">${stats?.heartbeat || 'N/A'}</div>
          <div class="stat-sub text-[10px] text-muted-foreground">Next scheduled run</div>
        </div>
      </header>

      <div class="grid grid-cols-3 gap-6">
        <!-- Activity & Timeline Feed -->
        <section class="col-span-2 card p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">Live Activity Feed</h2>
            <span class="status-dot green"></span>
          </div>
          <div class="activity-feed space-y-3 overflow-y-auto max-h-[500px]">
            ${(data?.audit || []).map((item: any) => html`
              <div class="feed-item border-l-2 border-blue-500 pl-3 py-1">
                <div class="flex justify-between text-sm">
                  <span class="font-medium">${item.action}</span>
                  <span class="text-xs text-muted-foreground">${new Date(item.created_at).toLocaleTimeString()}</span>
                </div>
                <p class="text-xs text-muted-foreground">${item.actor_id || 'System'} performed ${item.action} ${item.resource ? `on ${item.resource}` : ''}.</p>
              </div>
            `)}
            ${!(data?.audit?.length) ? html`<div class="text-muted-foreground text-sm">No recent activity.</div>` : nothing}
          </div>
        </section>

        <!-- User Intelligence Quick View -->
        <section class="card p-4">
          <h2 class="text-lg font-semibold mb-4">User Intelligence</h2>
          <div class="space-y-4">
            ${(data?.intel || []).map((item: any) => html`
              <div class="intel-card p-3 bg-secondary/50 rounded-lg border border-border">
                <div class="text-sm font-medium">${item.key}</div>
                <div class="text-xs text-muted-foreground mb-2">${item.value}</div>
                <div class="w-full bg-muted rounded-full h-1.5">
                  <div class="bg-blue-500 h-1.5 rounded-full" style="width: ${(item.confidence_score || 0) * 100}%"></div>
                </div>
                <div class="text-[10px] text-right mt-1">${Math.round((item.confidence_score || 0) * 100)}% Confidence</div>
              </div>
            `)}
            ${!(data?.intel?.length) ? html`<div class="text-muted-foreground text-sm">No intelligence insights yet.</div>` : nothing}
          </div>
        </section>
      </div>
    </div>

    <style>
      .mission-control-dashboard {
        padding: 1.5rem;
      }
      .stat-card {
        border-radius: 12px;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
        animation: pulse 2s infinite;
      }
      .status-dot.green { background: #10b981; }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      .feed-item {
        transition: background 0.2s;
      }
      .feed-item:hover {
        background: rgba(0,0,0,0.02);
      }
    </style>
  `;
}
