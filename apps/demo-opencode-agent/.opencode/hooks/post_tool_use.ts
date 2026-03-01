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
        const toolName = inputData.tool_name || '';
        const toolUseId = inputData.tool_use_id || '';
        const toolInput = inputData.tool_input || {};
        const isMcpTool = toolName.startsWith('mcp__');

        const logDir = ensureSessionLogDir(sessionId);
        const logPath = path.join(logDir, 'post_tool_use.json');

        let logData: any[] = [];
        if (fs.existsSync(logPath)) {
            try {
                logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                if (!Array.isArray(logData)) logData = [];
            } catch (e) {
                logData = [];
            }
        }

        const logEntry: any = {
            tool_name: toolName,
            tool_use_id: toolUseId,
            session_id: sessionId,
            hook_event_name: inputData.hook_event_name || 'PostToolUse',
            is_mcp_tool: isMcpTool
        };

        if (isMcpTool) {
            const parts = toolName.split('__');
            if (parts.length >= 3) {
                logEntry.mcp_server = parts[1];
                logEntry.mcp_tool_name = parts.slice(2).join('__');
            }
            logEntry.input_keys = Object.keys(toolInput).slice(0, 10);
        }

        logData.push(logEntry);

        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

        process.exit(0);
    } catch (e) {
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}
