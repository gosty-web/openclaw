import { html, nothing } from "lit";
import type { AppViewState } from "../app-view-state.ts";

export function renderIntel(state: AppViewState) {
  const intel = state.missionControlData?.intel || [];

  // Filter news-like intel (habit/preference) vs opportunities (inference)
  const insights = intel.filter((item: any) => item.category === 'habit' || item.category === 'preference');
  const opportunities = intel.filter((item: any) => item.category === 'workflow' || item.category === 'inference');

  return html`
    <div class="p-6">
      <header class="mb-8">
        <h1 class="text-2xl font-bold">Intel & Insights</h1>
        <p class="text-muted-foreground">AI ecosystem trends and personalized intelligence</p>
      </header>

      <div class="grid grid-cols-2 gap-6">
        <section class="card p-4">
          <h2 class="font-bold mb-4 flex items-center gap-2">
            <span>🔥</span> Behavior Patterns
          </h2>
          <div class="space-y-4">
            ${insights.map((item: any) => html`
              <div class="p-3 border rounded-lg hover:bg-secondary/50 transition border-border bg-card">
                <h3 class="text-sm font-semibold">${item.key}</h3>
                <p class="text-xs text-muted-foreground mt-1">${item.value}</p>
                <div class="mt-2 flex justify-between items-center">
                  <span class="text-[10px] text-blue-500 font-medium">${item.category}</span>
                  <span class="text-[10px] text-muted-foreground">${Math.round(item.confidence_score * 100)}% confidence</span>
                </div>
              </div>
            `)}
            ${insights.length === 0 ? html`<div class="text-sm text-muted-foreground">No behavior patterns detected yet.</div>` : nothing}
          </div>
        </section>

        <section class="card p-4">
          <h2 class="font-bold mb-4 flex items-center gap-2">
            <span>⚡</span> Workflow Opportunities
          </h2>
          <div class="space-y-4">
             ${opportunities.map((item: any) => html`
               <div class="p-3 border rounded-lg border-yellow-500/30 bg-yellow-500/5">
                  <h3 class="text-sm font-semibold">${item.key}</h3>
                  <p class="text-xs text-muted-foreground mt-1">${item.value}</p>
                  <div class="mt-2 text-right">
                    <span class="text-[10px] text-yellow-600 font-medium">${item.source}</span>
                  </div>
               </div>
             `)}
             ${opportunities.length === 0 ? html`<div class="text-sm text-muted-foreground">No workflow opportunities identified.</div>` : nothing}
          </div>
        </section>
      </div>
    </div>
  `;
}
