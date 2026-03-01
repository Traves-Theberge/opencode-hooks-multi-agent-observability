import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { ensureSessionLogDir } from './utils/constants';

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

        const sessionId = inputData.session_id || 'unknown';

        const logDir = ensureSessionLogDir(sessionId);
        const logPath = path.join(logDir, 'subagent_start.json');

        let logData: any[] = [];
        if (fs.existsSync(logPath)) {
            try {
                logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                if (!Array.isArray(logData)) logData = [];
            } catch (e) {
                logData = [];
            }
        }

        logData.push(inputData);

        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

        process.exit(0);
    } catch (e) {
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}
