import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { parseArgs } from 'util';
import { spawnSync } from 'child_process';
import * as dotenv from 'dotenv';
import { ensureSessionLogDir } from './utils/constants';

dotenv.config();

function getCompletionMessages(): string[] {
    return [
        "Work complete!",
        "All done!",
        "Task finished!",
        "Job complete!",
        "Ready for next task!",
    ];
}

function getTtsScriptPath(): string | null {
    const ttsDir = path.join(__dirname, 'utils', 'tts');

    if (process.env.VOICEAI_API_KEY) {
        const script = path.join(ttsDir, 'voiceai_tts.ts');
        if (fs.existsSync(script)) return script;
    }

    const script = path.join(ttsDir, 'system_tts.ts');
    if (fs.existsSync(script)) return script;

    return null;
}

function getLlmCompletionMessage(): string {
    const llmDir = path.join(__dirname, 'utils', 'llm');

    if (process.env.OPENROUTER_API_KEY) {
        const script = path.join(llmDir, 'openrouter.ts');
        if (fs.existsSync(script)) {
            try {
                const result = spawnSync('bun', ['run', script, '--completion'], { encoding: 'utf8', timeout: 10000 });
                if (result.status === 0 && result.stdout.trim()) {
                    return result.stdout.trim();
                }
            } catch (e) { }
        }
    }


    const messages = getCompletionMessages();
    return messages[Math.floor(Math.random() * messages.length)] || '';
}

function announceCompletion() {
    try {
        const ttsScript = getTtsScriptPath();
        if (!ttsScript) return;

        const completionMessage = getLlmCompletionMessage();

        spawnSync('bun', ['run', ttsScript, completionMessage], { timeout: 10000 });
    } catch (e) { }
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
                'chat': { type: 'boolean', default: false },
                'notify': { type: 'boolean', default: false }
            },
            strict: false
        });

        const stdinStr = await readStdin();
        if (!stdinStr.trim()) process.exit(0);

        const inputData = JSON.parse(stdinStr);

        const sessionId = inputData.session_id || "";
        const stopHookActive = inputData.stop_hook_active || false;

        if (stopHookActive) {
            process.exit(0);
        }

        const logDir = ensureSessionLogDir(sessionId);
        const logPath = path.join(logDir, 'stop.json');

        let logData: any[] = [];
        if (fs.existsSync(logPath)) {
            try {
                logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                if (!Array.isArray(logData)) logData = [];
            } catch (e) {
                logData = [];
            }
        }

        const logEntry = {
            session_id: sessionId,
            hook_event_name: inputData.hook_event_name || 'Stop',
            stop_hook_active: stopHookActive
        };
        logData.push(logEntry);

        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

        if (values['chat'] && inputData.transcript_path) {
            const transcriptPath = inputData.transcript_path;
            if (fs.existsSync(transcriptPath)) {
                try {
                    const chatData = [];
                    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                chatData.push(JSON.parse(line));
                            } catch (e) { }
                        }
                    }
                    const chatFile = path.join(logDir, 'chat.json');
                    fs.writeFileSync(chatFile, JSON.stringify(chatData, null, 2));
                } catch (e) { }
            }
        }

        if (values['notify']) {
            announceCompletion();
        }

        process.exit(0);
    } catch (e) {
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}
