import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { parseArgs } from 'util';
import { spawnSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

function logSessionStart(inputData: any) {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'session_start.json');

    let logData: any[] = [];
    if (fs.existsSync(logFile)) {
        try {
            logData = JSON.parse(fs.readFileSync(logFile, 'utf8'));
            if (!Array.isArray(logData)) logData = [];
        } catch (e) {
            logData = [];
        }
    }

    const logEntry = {
        session_id: inputData.session_id || "unknown",
        hook_event_name: inputData.hook_event_name || "SessionStart",
        source: inputData.source || "unknown",
        model: inputData.model || "",
        agent_type: inputData.agent_type || "",
    };
    logData.push(logEntry);

    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
}

function getGitStatus(): { branch: string | null, uncommittedCount: number | null } {
    try {
        const branchResult = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', timeout: 5000 });
        const branch = branchResult.status === 0 ? branchResult.stdout.trim() : "unknown";

        const statusResult = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', timeout: 5000 });
        let uncommittedCount = 0;
        if (statusResult.status === 0 && statusResult.stdout.trim()) {
            uncommittedCount = statusResult.stdout.trim().split('\n').length;
        }

        return { branch, uncommittedCount };
    } catch (e) {
        return { branch: null, uncommittedCount: null };
    }
}

function getRecentIssues(): string | null {
    try {
        const ghCheck = spawnSync('which', ['gh']);
        if (ghCheck.status !== 0) return null;

        const result = spawnSync('gh', ['issue', 'list', '--limit', '5', '--state', 'open'], { encoding: 'utf8', timeout: 10000 });
        if (result.status === 0 && result.stdout.trim()) {
            return result.stdout.trim();
        }
    } catch (e) {
        // ignore
    }
    return null;
}

function loadDevelopmentContext(source: string, agentType: string = ""): string {
    const contextParts: string[] = [];

    contextParts.push(`Session started at: ${new Date().toISOString()}`);
    contextParts.push(`Session source: ${source}`);
    if (agentType) {
        contextParts.push(`Agent type: ${agentType}`);
    }

    const { branch, uncommittedCount } = getGitStatus();
    if (branch) {
        contextParts.push(`Git branch: ${branch}`);
        if (uncommittedCount && uncommittedCount > 0) {
            contextParts.push(`Uncommitted changes: ${uncommittedCount} files`);
        }
    }

    const contextFiles = [
        ".opencode/CONTEXT.md",
        ".opencode/TODO.md",
        "TODO.md",
        ".github/ISSUE_TEMPLATE.md"
    ];

    for (const filePath of contextFiles) {
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8').trim();
                if (content) {
                    contextParts.push(`\n--- Content from ${filePath} ---`);
                    contextParts.push(content.substring(0, 1000));
                }
            } catch (e) { }
        }
    }

    const issues = getRecentIssues();
    if (issues) {
        contextParts.push("\n--- Recent GitHub Issues ---");
        contextParts.push(issues);
    }

    return contextParts.join('\n');
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
                'load-context': { type: 'boolean', default: false },
                'announce': { type: 'boolean', default: false }
            },
            strict: false
        });

        const stdinStr = await readStdin();
        if (!stdinStr.trim()) process.exit(0);

        const inputData = JSON.parse(stdinStr);

        const sessionId = inputData.session_id || 'unknown';
        const source = inputData.source || 'unknown';
        const model = inputData.model || '';
        const agentType = inputData.agent_type || '';

        logSessionStart(inputData);

        if (values['load-context']) {
            const context = loadDevelopmentContext(source, agentType);
            if (context) {
                const output = {
                    hookSpecificOutput: {
                        hookEventName: "SessionStart",
                        additionalContext: context
                    }
                };
                console.log(JSON.stringify(output));
                process.exit(0);
            }
        }

        if (values['announce']) {
            try {
                const ttsScript = path.join(__dirname, 'utils', 'tts', 'system_tts.ts');
                if (fs.existsSync(ttsScript)) {
                    const messages: Record<string, string> = {
                        "startup": "OpenCode session started",
                        "resume": "Resuming previous session",
                        "clear": "Starting fresh session"
                    };
                    const message = messages[source as keyof typeof messages] || "Session started";

                    spawnSync('bun', ['run', ttsScript, message], { timeout: 5000 });
                }
            } catch (e) {
                // ignore
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
