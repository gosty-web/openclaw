import { html, nothing } from "lit";
import type { AppViewState } from "../app-view-state.ts";

export function renderMemories(state: AppViewState) {
  const intel = state.missionControlData?.intel || [];

  // Extract unique categories as topic clusters
  const topics = Array.from(new Set(intel.map((item: any) => item.category)));

  return html`
    <div class="p-6">
      <header class="mb-8">
        <h1 class="text-2xl font-bold">Brain & Memories</h1>
        <p class="text-muted-foreground">Long-term context and learned intelligence</p>
      </header>

      <div class="space-y-6">
        <div class="grid grid-cols-3 gap-6">
           <div class="card p-4 bg-blue-500/5 border-blue-500/20">
              <div class="text-3xl mb-2">🧊</div>
              <div class="text-lg font-bold">Long-term</div>
              <div class="text-xs text-muted-foreground">${intel.length} Insights indexed</div>
           </div>
           <div class="card p-4 bg-orange-500/5 border-orange-500/20">
              <div class="text-3xl mb-2">🔥</div>
              <div class="text-lg font-bold">Short-term</div>
              <div class="text-xs text-muted-foreground">Active session buffer</div>
           </div>
           <div class="card p-4 bg-purple-500/5 border-purple-500/20">
              <div class="text-3xl mb-2">🏛️</div>
              <div class="text-lg font-bold">Archival</div>
              <div class="text-xs text-muted-foreground">Compressed tiered storage</div>
           </div>
        </div>

        <section class="card p-4">
           <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold">Intelligence Topic Clusters</h2>
              <input type="text" class="px-3 py-1 rounded border text-sm bg-background" placeholder="Search memories..." />
           </div>

           <div class="flex flex-wrap gap-2">
              ${topics.map(topic => html`
                 <span class="px-3 py-1.5 bg-secondary rounded-full text-sm hover:bg-primary/20 cursor-pointer transition capitalize">
                    ${topic}
                 </span>
              `)}
              ${topics.length === 0 ? html`<div class="text-sm text-muted-foreground italic">No topic clusters formed.</div>` : nothing}
           </div>
        </section>

        <section class="card p-4">
           <h2 class="text-lg font-bold mb-4">Memory Index</h2>
           <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                 <thead class="text-xs text-muted-foreground uppercase bg-secondary/30">
                    <tr>
                       <th class="px-4 py-2">Key</th>
                       <th class="px-4 py-2">Category</th>
                       <th class="px-4 py-2">Confidence</th>
                       <th class="px-4 py-2">Last Observed</th>
                    </tr>
                 </thead>
                 <tbody>
                    ${intel.map((item: any) => html`
                       <tr class="border-b border-border">
                          <td class="px-4 py-3 font-medium">${item.key}</td>
                          <td class="px-4 py-3 capitalize">${item.category}</td>
                          <td class="px-4 py-3">${Math.round(item.confidence_score * 100)}%</td>
                          <td class="px-4 py-3 text-muted-foreground text-xs">${item.last_observed_at ? new Date(item.last_observed_at).toLocaleDateString() : 'Recent'}</td>
                       </tr>
                    `)}
                 </tbody>
              </table>
           </div>
        </section>
      </div>
    </div>
  `;
}
