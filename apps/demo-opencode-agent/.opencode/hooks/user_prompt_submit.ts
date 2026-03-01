import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { parseArgs } from 'util';
import { spawnSync } from 'child_process';
import * as dotenv from 'dotenv';
import { ensureSessionLogDir } from './utils/constants';

dotenv.config();

function logUserPrompt(sessionId: string, inputData: any) {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'user_prompt_submit.json');

    let logData: any[] = [];
    if (fs.existsSync(logFile)) {
        try {
            logData = JSON.parse(fs.readFileSync(logFile, 'utf8'));
            if (!Array.isArray(logData)) logData = [];
        } catch (e) {
            logData = [];
        }
    }

    logData.push(inputData);

    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
}

function manageSessionData(sessionId: string, prompt: string, nameAgent: boolean = false) {
    const sessionsDir = path.join(process.cwd(), '.opencode', 'data', 'sessions');
    if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const sessionFile = path.join(sessionsDir, `${sessionId}.json`);
    let sessionData: any = { session_id: sessionId, prompts: [] };

    if (fs.existsSync(sessionFile)) {
        try {
            sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
        } catch (e) { }
    }

    if (!sessionData.prompts) sessionData.prompts = [];
    sessionData.prompts.push(prompt);

    if (nameAgent && !sessionData.agent_name) {
        let agentName = null;

        if (!agentName) {
            try {
                const llmScript = path.join(__dirname, 'utils', 'llm', 'openrouter.ts');
                if (fs.existsSync(llmScript)) {
                    const result = spawnSync('bun', ['run', llmScript, '--agent-name'], { encoding: 'utf8', timeout: 10000 });
                    if (result.status === 0 && result.stdout.trim()) {
                        const outName = result.stdout.trim();
                        if (outName.split(/\s+/).length === 1 && /^[a-zA-Z0-9_-]+$/.test(outName)) {
                            agentName = outName;
                        }
                    }
                }
            } catch (e) { }
        }

        if (agentName) {
            sessionData.agent_name = agentName;
        }
    }

    try {
        fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
    } catch (e) { }
}

function validatePrompt(prompt: string): { isValid: boolean, reason: string | null } {
    const blockedPatterns: Array<[string, string]> = [
        // ['rm -rf /', 'Dangerous command detected'],
    ];

    const promptLower = prompt.toLowerCase();

    for (const [pattern, reason] of blockedPatterns) {
        if (promptLower.includes(pattern.toLowerCase())) {
            return { isValid: false, reason };
        }
    }

    return { isValid: true, reason: null };
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
        const { values } = parseArgs({
            args: process.argv.slice(2),
            options: {
                'validate': { type: 'boolean', default: false },
                'log-only': { type: 'boolean', default: false },
                'store-last-prompt': { type: 'boolean', default: false },
                'name-agent': { type: 'boolean', default: false }
            },
            strict: false
        });

        const stdinStr = await readStdin();
        if (!stdinStr.trim()) process.exit(0);

        const inputData = JSON.parse(stdinStr);

        const sessionId = inputData.session_id || 'unknown';
        const prompt = inputData.prompt || '';

        logUserPrompt(sessionId, inputData);

        if (values['store-last-prompt'] || values['name-agent']) {
            manageSessionData(sessionId, prompt, values['name-agent'] as boolean);
        }

        if (values['validate'] && !values['log-only']) {
            const { isValid, reason } = validatePrompt(prompt);
            if (!isValid) {
                const output = {
                    decision: "block",
                    reason: `Prompt blocked: ${reason}`
                };
                console.log(JSON.stringify(output));
                process.exit(0);
            }
        }

        process.exit(0);
    } catch (e) {
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}
