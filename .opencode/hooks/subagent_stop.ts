import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { parseArgs } from 'util';
import { spawnSync } from 'child_process';
import * as dotenv from 'dotenv';
import { ensureSessionLogDir } from './utils/constants';

dotenv.config();

function getTtsScriptPath(): string | null {
    const ttsDir = path.join(__dirname, 'utils', 'tts');

    if (process.env.ELEVENLABS_API_KEY) {
        const script = path.join(ttsDir, 'elevenlabs_tts.ts');
        if (fs.existsSync(script)) return script;
    }

    if (process.env.OPENAI_API_KEY) {
        const script = path.join(ttsDir, 'openai_tts.ts');
        if (fs.existsSync(script)) return script;
    }

    const script = path.join(ttsDir, 'system_tts.ts');
    if (fs.existsSync(script)) return script;

    return null;
}

function announceSubagentCompletion() {
    try {
        const ttsScript = getTtsScriptPath();
        if (!ttsScript) return;

        const completionMessage = "Subagent Complete";

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
        const agentId = inputData.agent_id || "";
        const agentType = inputData.agent_type || "";
        const agentTranscriptPath = inputData.agent_transcript_path || "";

        if (stopHookActive) {
            process.exit(0);
        }

        const logDir = ensureSessionLogDir(sessionId);
        const logPath = path.join(logDir, 'subagent_stop.json');

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
            hook_event_name: inputData.hook_event_name || 'SubagentStop',
            stop_hook_active: stopHookActive,
            agent_id: agentId,
            agent_type: agentType,
            agent_transcript_path: agentTranscriptPath
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
            announceSubagentCompletion();
        }

        process.exit(0);
    } catch (e) {
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}
