import * as fs from 'fs';
import * as path from 'path';

const SESSION_LOGS_DIR = path.join(
    process.env.HOME || '/tmp',
    '.opencode',
    'session-logs'
);

/**
 * Ensures a per-session log directory exists and returns its path.
 */
export function ensureSessionLogDir(sessionId: string): string {
    const dir = path.join(SESSION_LOGS_DIR, sessionId || 'unknown');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
