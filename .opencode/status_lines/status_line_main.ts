import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { spawnSync } from 'child_process';

const MAX_PROMPT_LENGTH = 50;
const SHOW_GIT_INFO = false;

function logStatusLine(inputData: any, statusLineOutput: string, errorMessage?: string) {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'status_line.json');

    let logData: any[] = [];
    if (fs.existsSync(logFile)) {
        try {
            logData = JSON.parse(fs.readFileSync(logFile, 'utf8'));
            if (!Array.isArray(logData)) logData = [];
        } catch (e) {
            logData = [];
        }
    }

    const logEntry: any = {
        timestamp: new Date().toISOString(),
        input_data: inputData,
        status_line_output: statusLineOutput,
    };

    if (errorMessage) {
        logEntry.error = errorMessage;
    }

    logData.push(logEntry);

    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
}

function getGitBranch(): string | null {
    try {
        const result = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', timeout: 2000 });
        if (result.status === 0) {
            return result.stdout.trim();
        }
    } catch (e) { }
    return null;
}

function getGitStatus(): string {
    try {
        const result = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', timeout: 2000 });
        if (result.status === 0) {
            const changes = result.stdout.trim();
            if (changes) {
                const lines = changes.split('\n');
                return `±${lines.length}`;
            }
        }
    } catch (e) { }
    return "";
}

function getSessionData(sessionId: string): { data: any | null, error: string | null } {
    const sessionFile = path.join(process.cwd(), '.opencode', 'data', 'sessions', `${sessionId}.json`);

    if (!fs.existsSync(sessionFile)) {
        return { data: null, error: `Session file ${sessionFile} does not exist` };
    }

    try {
        const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
        return { data: sessionData, error: null };
    } catch (e: any) {
        return { data: null, error: `Error reading session file: ${e.message}` };
    }
}

function truncatePrompt(prompt: string, maxLength = MAX_PROMPT_LENGTH): string {
    prompt = prompt.replace(/\s+/g, ' ').trim();
    if (prompt.length > maxLength) {
        return prompt.substring(0, maxLength - 3) + "...";
    }
    return prompt;
}

function getPromptIcon(prompt: string): string {
    const promptLower = prompt.toLowerCase();
    if (prompt.startsWith("/")) {
        return "⚡";
    } else if (prompt.includes("?")) {
        return "❓";
    } else if (["create", "write", "add", "implement", "build"].some(w => promptLower.includes(w))) {
        return "💡";
    } else if (["fix", "debug", "error", "issue"].some(w => promptLower.includes(w))) {
        return "🐛";
    } else if (["refactor", "improve", "optimize"].some(w => promptLower.includes(w))) {
        return "♻️";
    } else {
        return "💬";
    }
}

function generateStatusLine(inputData: any): string {
    const sessionId = inputData.session_id || "unknown";
    const modelInfo = inputData.model || {};
    const modelName = modelInfo.display_name || "OpenCode";

    const { data: sessionData, error } = getSessionData(sessionId);

    if (error) {
        logStatusLine(inputData, `[${modelName}] 💭 No session data`, error);
        return `\x1b[36m[${modelName}]\x1b[0m \x1b[90m💭 No session data\x1b[0m`;
    }

    const agentName = sessionData.agent_name || "Agent";
    const prompts = sessionData.prompts || [];

    const parts: string[] = [];
    parts.push(`\x1b[91m[${agentName}]\x1b[0m`);
    parts.push(`\x1b[34m[${modelName}]\x1b[0m`);

    if (SHOW_GIT_INFO) {
        const gitBranch = getGitBranch();
        if (gitBranch) {
            const gitStatus = getGitStatus();
            let gitInfo = `🌿 ${gitBranch}`;
            if (gitStatus) {
                gitInfo += ` ${gitStatus}`;
            }
            parts.push(`\x1b[32m${gitInfo}\x1b[0m`);
        }
    }

    if (prompts.length > 0) {
        const currentPrompt = prompts[prompts.length - 1];
        const icon = getPromptIcon(currentPrompt);
        const truncated = truncatePrompt(currentPrompt, MAX_PROMPT_LENGTH);
        parts.push(`${icon} \x1b[97m${truncated}\x1b[0m`);
    } else {
        parts.push("\x1b[90m💭 No prompts yet\x1b[0m");
    }

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

        logStatusLine(inputData, statusLine);
        console.log(statusLine);

        process.exit(0);
    } catch (e: any) {
        if (e instanceof SyntaxError) {
            console.log("\x1b[31m[Agent] [OpenCode] 💭 JSON Error\x1b[0m");
        } else {
            console.log(`\x1b[31m[Agent] [OpenCode] 💭 Error: ${e.message}\x1b[0m`);
        }
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}
