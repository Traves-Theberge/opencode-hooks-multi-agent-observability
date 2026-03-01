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

function announceNotification() {
    try {
        const ttsScript = getTtsScriptPath();
        if (!ttsScript) return;

        const engineerName = (process.env.ENGINEER_NAME || '').trim();

        let notificationMessage = "Your agent needs your input";
        if (engineerName && Math.random() < 0.3) {
            notificationMessage = `${engineerName}, your agent needs your input`;
        }

        spawnSync('bun', ['run', ttsScript, notificationMessage], { timeout: 10000 });
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
                'notify': { type: 'boolean', default: false }
            },
            strict: false
        });

        const stdinStr = await readStdin();
        if (!stdinStr.trim()) process.exit(0);

        const inputData = JSON.parse(stdinStr);

        const sessionId = inputData.session_id || 'unknown';
        const notificationType = inputData.notification_type || '';
        const message = inputData.message || '';
        const title = inputData.title || '';

        const logDir = ensureSessionLogDir(sessionId);
        const logPath = path.join(logDir, 'notification.json');

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
            hook_event_name: inputData.hook_event_name || 'Notification',
            notification_type: notificationType,
            message: message,
            title: title
        };
        logData.push(logEntry);

        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

        if (values['notify']) {
            if (notificationType === 'permission_prompt') {
                announceNotification();
            } else if (notificationType === 'idle_prompt' && message !== 'OpenCode is waiting for your input') {
                announceNotification();
            } else if (!notificationType && message !== 'OpenCode is waiting for your input') {
                announceNotification();
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
