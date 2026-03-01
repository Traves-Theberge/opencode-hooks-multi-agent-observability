import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Model Extractor Utility
 * Extracts model name from OpenCode transcript with caching.
 */

// Set to false to disable caching and always read from transcript
const ENABLE_CACHING = false;

/**
 * Extract model name from transcript with file-based caching.
 *
 * @param sessionId OpenCode session ID
 * @param transcriptPath Path to the .jsonl transcript file
 * @param ttl Cache time-to-live in seconds (default: 60)
 * @returns Model name string (e.g., "opencode-flash-1-5-20251001") or empty string if not found
 */
export function getModelFromTranscript(sessionId: string, transcriptPath: string, ttl: number = 60): string {
    // Set up cache directory
    const cacheDir = path.join(os.homedir(), '.opencode', 'data', 'opencode-model-cache');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cacheFile = path.join(cacheDir, `${sessionId}.json`);
    const currentTime = Date.now() / 1000;

    // Try to read from cache (only if caching is enabled)
    if (ENABLE_CACHING && fs.existsSync(cacheFile)) {
        try {
            const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

            // Check if cache is still fresh
            const cacheAge = currentTime - (cacheData.timestamp || 0);
            if (cacheAge < ttl) {
                return cacheData.model || '';
            }
        } catch (error) {
            // Cache file corrupted or unreadable, will regenerate
        }
    }

    // Cache miss or stale - extract from transcript
    const modelName = extractModelFromTranscript(transcriptPath);

    // Save to cache (only if caching is enabled)
    if (ENABLE_CACHING) {
        try {
            const cacheData = {
                model: modelName,
                timestamp: currentTime,
                ttl: ttl
            };
            fs.writeFileSync(cacheFile, JSON.stringify(cacheData));
        } catch (error) {
            // Cache write failed, not critical - continue without cache
        }
    }

    return modelName;
}

/**
 * Extract model name from transcript by finding most recent assistant message.
 *
 * @param transcriptPath Path to the .jsonl transcript file
 * @returns Model name string or empty string if not found
 */
export function extractModelFromTranscript(transcriptPath: string): string {
    if (!fs.existsSync(transcriptPath)) {
        return '';
    }

    let modelName = '';

    try {
        // Read transcript file in reverse to find most recent assistant message
        // We'll read the whole file since we need to find the LAST occurrence
        const content = fs.readFileSync(transcriptPath, 'utf8');
        const lines = content.split('\n').reverse();

        // Iterate in reverse to find most recent assistant message with model
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            try {
                const entry = JSON.parse(line);

                // Check if this is an assistant message with a model field
                if (
                    entry.type === 'assistant' &&
                    entry.message &&
                    entry.message.model
                ) {
                    modelName = entry.message.model;
                    break; // Found the most recent one
                }
            } catch (error) {
                // Skip invalid JSON lines
                continue;
            }
        }
    } catch (error) {
        // File read error
        return '';
    }

    return modelName;
}

// Ensure this script can be run standalone as a test
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: bun run model_extractor.ts <session_id> <transcript_path>");
        process.exit(1);
    }
    const sessionId = args[0];
    const transcriptPath = args[1];

    const model = getModelFromTranscript(sessionId, transcriptPath);
    console.log(`Model: ${model}`);
}
