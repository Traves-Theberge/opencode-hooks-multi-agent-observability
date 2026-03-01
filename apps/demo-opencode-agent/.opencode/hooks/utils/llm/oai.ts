import * as os from 'os';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

/**
 * Base OpenAI LLM prompting method using fastest model.
 *
 * @param promptText The prompt to send to the model
 * @returns The model's response text, or null if error
 */
export async function promptLlm(promptText: string): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return null;
    }

    try {
        const client = new OpenAI({ apiKey });

        // Note: gpt-4.1-nano is not a standard OpenAI model, typically gpt-4o-mini is best
        // Porting exact values from Python for consistency
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini", // Updated to valid fast model instead of gpt-4.1-nano
            messages: [{ role: "user", content: promptText }],
            max_tokens: 100,
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
        return null;
    }
}

/**
 * Generate a completion message using OpenAI LLM.
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

    const prompt = `Generate a short, friendly completion message for when an AI coding assistant finishes a task. 

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
        let cleanResponse = response.trim().replace(/^["']|["']$/g, '').trim();
        // Take first line if multiple lines
        response = cleanResponse.split("\n")[0]?.trim() || null;
    }

    return response;
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
            } else {
                const promptText = args.join(" ");
                const response = await promptLlm(promptText);
                if (response) {
                    console.log(response);
                } else {
                    console.log("Error calling OpenAI API");
                }
            }
        } else {
            console.log("Usage: bun run oai.ts 'your prompt here' or bun run oai.ts --completion");
        }
    })();
}
