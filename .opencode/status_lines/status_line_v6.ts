import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

/**
 * Status Line v6 - Context Window Usage
 * Display: [Model] # [###---] | 42.5% used | ~115k left | session_id
 * Visual progress indicator with percentage and session ID
 */

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BRIGHT_WHITE = "\x1b[97m";
const DIM = "\x1b[90m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const RESET = "\x1b[0m";

function getUsageColor(percentage: number): string {
    if (percentage < 50) return GREEN;
    if (percentage < 75) return YELLOW;
    if (percentage < 90) return RED;
    return "\x1b[91m"; // Bright red for critical
}

function createProgressBar(percentage: number, width = 15): string {
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;

    const color = getUsageColor(percentage);

    const barStr = `${color}${'#'.repeat(filled)}${DIM}${'-'.repeat(empty)}${RESET}`;
    return `[${barStr}]`;
}

function formatTokens(tokens: number | null): string {
    if (tokens === null || tokens === undefined) return "0";
    if (tokens < 1000) return Math.floor(tokens).toString();
    if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}k`;
    return `${(tokens / 1000000).toFixed(2)}M`;
}

function generateStatusLine(inputData: any): string {
    const modelInfo = inputData.model || {};
    const modelName = modelInfo.display_name || "OpenCode";

    const sessionId = inputData.session_id || "--------";

    const contextData = inputData.context_window || {};
    const usedPercentage = contextData.used_percentage || 0;
    const contextWindowSize = contextData.context_window_size || 200000;

    const remainingTokens = Math.floor(contextWindowSize * ((100 - usedPercentage) / 100));

    const usageColor = getUsageColor(usedPercentage);

    const parts: string[] = [];

    parts.push(`${CYAN}[${modelName}]${RESET}`);

    const progressBar = createProgressBar(usedPercentage);
    parts.push(`${MAGENTA}#${RESET} ${progressBar}`);

    parts.push(`${usageColor}${usedPercentage.toFixed(1)}%${RESET} used`);

    const tokensLeftStr = formatTokens(remainingTokens);
    parts.push(`${BLUE}~${tokensLeftStr} left${RESET}`);

    parts.push(`${DIM}${sessionId}${RESET}`);

    return parts.join(" | ");
}

async function readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => resolve(data));
        process.stdin.on('error', reject);
    });
}

async function main() {
    try {
        const stdinStr = await readStdin();
        if (!stdinStr.trim()) process.exit(0);

        const inputData = JSON.parse(stdinStr);

        const statusLine = generateStatusLine(inputData);

        console.log(statusLine);

        process.exit(0);
    } catch (e: any) {
        if (e instanceof SyntaxError) {
            console.log(`${RED}[OpenCode] # Error: Invalid JSON${RESET}`);
        } else {
            console.log(`${RED}[OpenCode] # Error: ${e.message}${RESET}`);
        }
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}
