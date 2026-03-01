import * as os from 'os';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

/**
 * Base LLM prompting method using OpenRouter.
 *
 * @param promptText The prompt to send to the model
 * @returns The model's response text, or null if error
 */
export async function promptLlm(promptText: string): Promise<string | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return null;
    }

    try {
        const client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey
        });

        const response = await client.chat.completions.create({
            model: "anthropic/claude-3.5-haiku-20241022",
            max_tokens: 100,
            temperature: 0.3,
            messages: [{ role: "user", content: promptText }]
        });

        return response.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
        return null;
    }
}

/**
 * Generate a completion message using OpenRouter LLM.
 *
 * @returns A natural language completion message, or null if error
 */
export async function generateCompletionMessage(): Promise<string | null> {
    const engineerName = (process.env.ENGINEER_NAME || "").trim();

    let nameInstruction = "";
    let examples = "";

    if (engineerName) {
        nameInstruction = `Sometimes (about 30% of the time) include the engineer's name '${engineerName}' in a natural way.`;
        examples = `Examples of the style:
- Standard: "Work complete!", "All done!", "Task finished!", "Ready for your next move!"
- Personalized: "${engineerName}, all set!", "Ready for you, ${engineerName}!", "Complete, ${engineerName}!", "${engineerName}, we're done!"`;
    } else {
        examples = `Examples of the style: "Work complete!", "All done!", "Task finished!", "Ready for your next move!"`;
    }

    const prompt = `Generate a short, concise, friendly completion message for when an AI coding assistant finishes a task.

Requirements:
- Keep it under 10 words
- Make it positive and future focused
- Use natural, conversational language
- Focus on completion/readiness
- Do NOT include quotes, formatting, or explanations
- Return ONLY the completion message text
${nameInstruction}

${examples}

Generate ONE completion message:`;

    let response = await promptLlm(prompt);

    // Clean up response - remove quotes and extra formatting
    if (response) {
        response = response.trim().replace(/^["']|["']$/g, '').trim();
        // Take first line if multiple lines
        response = response.split('\n')[0].trim();
    }

    return response;
}

/**
 * Generate a single-word agent name using OpenRouter LLM.
 *
 * @returns A single alphanumeric agent name, or null if error
 */
export async function generateAgentName(): Promise<string | null> {
    const prompt = `Generate a single creative agent name for an AI coding assistant.

Requirements:
- MUST be a single word (no spaces)
- MUST be alphanumeric only (letters and numbers, no special characters)
- Make it memorable and related to coding/tech/AI
- Keep it between 4-12 characters
- Examples: CodeNinja, ByteBot, PixelPro, NexusAI, SwiftDev
- Do NOT include quotes, formatting, or explanations
- Return ONLY the agent name

Generate ONE agent name:`;

    let response = await promptLlm(prompt);

    // Clean up response - remove quotes and extra formatting
    if (response) {
        response = response.trim().replace(/^["']|["']$/g, '').trim();
        // Take first word if multiple words
        response = response.split(/\s+/)[0] || null;
        // Validate it's alphanumeric
        if (response && /^[a-zA-Z0-9]+$/.test(response)) {
            return response;
        }
    }

    return null;
}

// Command line interface for testing
if (require.main === module) {
    (async () => {
        const args = process.argv.slice(2);
        if (args.length > 0) {
            if (args[0] === '--completion') {
                const message = await generateCompletionMessage();
                if (message) {
                    console.log(message);
                } else {
                    console.log("Error generating completion message");
                }
            } else if (args[0] === '--agent-name') {
                const agentName = await generateAgentName();
                if (agentName) {
                    console.log(agentName);
                } else {
                    console.log("Error generating agent name");
                }
            } else {
                const promptText = args.join(" ");
                const response = await promptLlm(promptText);
                if (response) {
                    console.log(response);
                } else {
                    console.log("Error calling OpenRouter API");
                }
            }
        } else {
            console.log("Usage: bun run openrouter.ts 'your prompt here' or bun run openrouter.ts --completion or bun run openrouter.ts --agent-name");
        }
    })();
}
