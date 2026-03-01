import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { parseArgs } from 'util';
import { spawnSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

function logSessionEnd(inputData: any, reason: string) {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'session_end.json');

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
        hook_event_name: inputData.hook_event_name || "SessionEnd",
        reason: reason,
        logged_at: new Date().toISOString()
    };
    logData.push(logEntry);

    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
}

function saveSessionStatistics(inputData: any) {
    try {
        const sessionId = inputData.session_id || 'unknown';
        const reason = inputData.reason || 'other';
        const transcriptPath = inputData.transcript_path || '';

        let messageCount = 0;
        if (transcriptPath && fs.existsSync(transcriptPath)) {
            try {
                const content = fs.readFileSync(transcriptPath, 'utf8');
                messageCount = content.split('\n').filter(line => line.trim() !== '').length;
            } catch (e) {
                // Ignore
            }
        }

        const statsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(statsDir)) {
            fs.mkdirSync(statsDir, { recursive: true });
        }
        const statsFile = path.join(statsDir, 'session_statistics.json');

        let stats: any[] = [];
        if (fs.existsSync(statsFile)) {
            try {
                stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
                if (!Array.isArray(stats)) stats = [];
            } catch (e) {
                stats = [];
            }
        }

        stats.push({
            session_id: sessionId,
            ended_at: new Date().toISOString(),
            reason: reason,
            message_count: messageCount
        });

        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    } catch (e) {
        // Ignore
    }
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
                'announce': { type: 'boolean', default: false },
                'save-stats': { type: 'boolean', default: false }
            },
            strict: false
        });

        const stdinStr = await readStdin();
        if (!stdinStr.trim()) process.exit(0);

        const inputData = JSON.parse(stdinStr);

        const sessionId = inputData.session_id || 'unknown';
        const reason = inputData.reason || 'other';

        logSessionEnd(inputData, reason);

        if (values['save-stats']) {
            saveSessionStatistics(inputData);
        }

        if (values['announce']) {
            try {
                const ttsScript = path.join(__dirname, 'utils', 'tts', 'system_tts.ts');

                if (fs.existsSync(ttsScript)) {
                    const messages: Record<string, string> = {
                        "clear": "Session cleared",
                        "logout": "Logging out",
                        "prompt_input_exit": "Session ended",
                        "bypass_permissions_disabled": "Bypass permissions disabled",
                        "other": "Session ended"
                    };
                    const message = messages[reason as keyof typeof messages] || "Session ended";

                    spawnSync('bun', ['run', ttsScript, message], { timeout: 5000 });
                }
            } catch (e) {
                // Ignore
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
