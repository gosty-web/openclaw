# OpenClaw Repository Audit

## Core Systems Mapping

- **Agent Runtime Loop:** `src/agents/pi-embedded-runner/run.ts`. Implements the main embedded runner with retry logic, auth profile rotation, and tool execution.
- **Memory System:** `src/memory/`. Uses `node:sqlite` and `sqlite-vec`. Implements embedding-based search and FTS.
- **Tool System:** `src/agents/tools/` and `src/agents/openclaw-tools.ts`. Extensible tool registration system.
- **Reflection System:** **MISSING**. No explicit self-correction or reflection loop found.
- **Multi-agent/Swarm System:** `src/agents/subagent-registry.ts` and `src/agents/tools/subagents-tool.ts`. Supports spawning and steering sub-agents. **PARTIAL**. Needs Hive orchestration.
- **Agency Module:** **MISSING** (referred to as Hive in upcoming phases).
- **Provider Abstraction:** `src/agents/pi-embedded-runner/model.ts` and `src/agents/models-config.providers.ts`. Supports multiple providers via `pi-ai` SDK.
- **UI Architecture:** `ui/src/ui/`. Built with Lit. Uses views and controllers for state management.
- **Event Bus / WebSocket Layer:** `src/infra/*-events.ts` and `src/gateway/`.
- **Database Schema:** `src/memory/memory-schema.ts` (Memory) and `src/infra/db-schema.ts` (Global Infrastructure).

## Feature Status Tracking

| Feature | Status | Notes |
|---|-|---|
| 1. PROACTIVE ASSISTANCE ENGINE | **PARTIAL** | DB schema and heartbeat hooks exist; pattern recognition and task initiation logic are stubs. |
| 2. ADVANCED MEMORY SYSTEM | **PARTIAL** | Basic SQLite memory exists. Lacks tiers, access tracking, decay, and deduplication. |
| 3. MULTI-AGENT SYSTEM EXPANSION | **PARTIAL** | Sub-agents exist. Lacks Hive mesh, isolation, and goal decomposition. |
| 4. AGENCY → HIVE REFACTOR | **MISSING** | Will be implemented as Hive module. |
| 5. FORGE MODULE | **PARTIAL** | DB schema exists; engine and sandbox implementation are missing. |
| 6. DYNAMIC SUB-AGENT WORKSPACES | **MISSING** | No workspace isolation for sub-agents yet. |
| 7. VOICE + CALL INTEGRATION | **PARTIAL** | `voice-message-tool` exists. Lacks standard ElevenLabs TTS integration and Twilio calls. |
| 8. PROVIDER EXPANSION | **PARTIAL** | Missing xAI Grok, DeepSeek, Groq. |
| 9. OBSERVABILITY LAYER | **PARTIAL** | UI views exist as placeholders. Backend wiring is missing. |
| 10. RUNTIME SELF-MODIFICATION | **PARTIAL** | `runtime-config-tool` exists. Audit logs are missing diffs and structured tracking. |

## Structured Enhancement Plan

1. **Schema Upgrades:** Update `src/memory/memory-schema.ts` and ensure `src/infra/db-schema.ts` is fully wired.
2. **Provider Expansion:** Add missing providers to `models-config.providers.ts`.
3. **Memory Upgrade:** Implement tiers and deduplication in `src/memory/manager.ts`.
4. **Hive Module:** Implement `src/hive/` for multi-agent orchestration.
5. **Forge Module:** Implement failure analysis and sandbox testing.
6. **Proactive Engine:** Complete `PatternRecognizer` and predictive logic.
7. **Voice Integration:** Standardize ElevenLabs and Gemini audio.
8. **Workspaces:** Implement isolation in `src/agents/workspace-isolation.ts`.
9. **Observability:** Wire UI to backend data via mission control tables.
