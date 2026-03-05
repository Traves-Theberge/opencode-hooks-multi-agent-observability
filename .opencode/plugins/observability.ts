/**
 * OpenCode Observability Plugin
 *
 * Sends telemetry events from OpenCode sessions to the local
 * multi-agent observability dashboard server.
 *
 * Events captured:
 *   - session.created  → SessionStart
 *   - session.idle     → SessionIdle
 *   - session.error    → SessionError
 *   - tool.execute.before → PreToolUse
 *   - tool.execute.after  → PostToolUse
 *   - message.updated     → MessageUpdated
 */

const SERVER_URL = process.env.OBSERVABILITY_SERVER_URL || "http://localhost:4000";
const SOURCE_APP = "opencode";

// Unique session id – set once when the plugin initialises and
// reused for every event in the same opencode session.
let sessionId = crypto.randomUUID();

// ── helpers ──────────────────────────────────────────────────

async function sendEvent(
    hookEventType: string,
    payload: Record<string, any>,
    modelName?: string,
) {
    try {
        const body = {
            source_app: SOURCE_APP,
            session_id: sessionId,
            hook_event_type: hookEventType,
            payload,
            timestamp: Date.now(),
            ...(modelName ? { model_name: modelName } : {}),
        };

        await fetch(`${SERVER_URL}/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch {
        // Silently swallow – the dashboard server may not be running.
    }
}

// ── plugin definition ────────────────────────────────────────

export const ObservabilityPlugin = async ({
    project,
    client,
    $,
    directory,
    worktree,
}: any) => {
    // Fire an initial "PluginLoaded" event so the dashboard knows
    // this OpenCode session exists even before any tool call.
    await sendEvent("PluginLoaded", {
        directory,
        worktree,
        message: "Observability plugin initialised",
    });

    return {
        // ── session / lifecycle events ───────────────────────────
        event: async ({ event }: { event: { type: string; properties?: any } }) => {
            switch (event.type) {
                case "session.created":
                    // Capture the real session id if OpenCode exposes one
                    if (event.properties?.sessionId) {
                        sessionId = event.properties.sessionId;
                    }
                    await sendEvent("SessionStart", {
                        ...event.properties,
                        directory,
                    });
                    break;

                case "session.idle":
                    await sendEvent("SessionIdle", {
                        ...event.properties,
                        directory,
                    });
                    break;

                case "session.error":
                    await sendEvent("SessionError", {
                        ...event.properties,
                        directory,
                    });
                    break;

                case "session.updated":
                    await sendEvent("SessionUpdated", {
                        ...event.properties,
                        directory,
                    });
                    break;

                case "message.updated":
                    await sendEvent("MessageUpdated", {
                        ...event.properties,
                        directory,
                    });
                    break;

                case "message.part.updated":
                    await sendEvent("MessagePartUpdated", {
                        ...event.properties,
                        directory,
                    });
                    break;

                case "file.edited":
                    await sendEvent("FileEdited", {
                        ...event.properties,
                        directory,
                    });
                    break;

                default:
                    // Forward any other event generically so the dashboard
                    // can still display it.
                    await sendEvent(event.type, {
                        ...event.properties,
                        directory,
                    });
                    break;
            }
        },

        // ── tool hooks ───────────────────────────────────────────
        "tool.execute.before": async (input: any, output: any) => {
            await sendEvent("PreToolUse", {
                tool_name: input.tool,
                tool_input: output.args,
                directory,
            });
        },

        "tool.execute.after": async (input: any, output: any) => {
            await sendEvent("PostToolUse", {
                tool_name: input.tool,
                tool_input: output.args,
                tool_response: output.result
                    ? { success: true }
                    : { success: false },
                directory,
            });
        },
    };
};
