import { promptLlm } from './llm/openrouter';

/**
 * Generate a concise one-sentence summary of a hook event for engineers.
 *
 * @param eventData The hook event data containing event_type, payload, etc.
 * @returns A one-sentence summary, or null if generation fails
 */
export async function generateEventSummary(eventData: Record<string, any>): Promise<string | null> {
    const eventType = eventData.hook_event_type || "Unknown";
    const payload = eventData.payload || {};

    // Convert payload to string representation
    let payloadStr = JSON.stringify(payload, null, 2);
    if (payloadStr.length > 1000) {
        payloadStr = payloadStr.substring(0, 1000) + "...";
    }

    const prompt = `Generate a one-sentence summary of this OpenCode hook event payload for an engineer monitoring the system.

Event Type: ${eventType}
Payload:
${payloadStr}

Requirements:
- ONE sentence only (no period at the end)
- Focus on the key action or information in the payload
- Be specific and technical
- Keep under 15 words
- Use present tense
- No quotes or formatting
- Return ONLY the summary text

Examples:
- Reads configuration file from project root
- Executes npm install to update dependencies
- Searches web for React documentation
- Edits database schema to add user table
- Agent responds with implementation plan

Generate the summary based on the payload:`;

    let summary = await promptLlm(prompt);

    // Clean up the response
    if (summary) {
        summary = summary.trim().replace(/^["']|["']$/g, '').replace(/\.$/, '').trim();
        // Take only the first line if multiple
        summary = summary.split('\n')[0].trim();
        // Ensure it's not too long
        if (summary.length > 100) {
            summary = summary.substring(0, 97) + "...";
        }
    }

    return summary;
}
