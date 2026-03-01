import * as fs from 'fs';
import * as path from 'path';

/**
 * Constants for OpenCode Hooks.
 */

// Base directory for all logs
// Default is 'logs' in the current working directory
export const LOG_BASE_DIR = process.env.CLAUDE_HOOKS_LOG_DIR || "logs";

/**
 * Get the log directory for a specific session.
 * 
 * @param sessionId The OpenCode session ID
 * @returns Path string for the session's log directory
 */
export function getSessionLogDir(sessionId: string): string {
    return path.join(LOG_BASE_DIR, sessionId);
}

/**
 * Ensure the log directory for a session exists.
 * 
 * @param sessionId The OpenCode session ID
 * @returns Path string for the session's log directory
 */
export function ensureSessionLogDir(sessionId: string): string {
    const logDir = getSessionLogDir(sessionId);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    return logDir;
}
