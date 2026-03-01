import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { parseArgs } from 'util';

/**
 * Stop hook validator: checks that a new file was created in a directory.
 *
 * Usage:
 *     bun run .opencode/hooks/validators/validate_new_file.ts --directory specs --extension .md
 *
 * Reads the Stop hook JSON from stdin. Scans the directory for files matching
 * the extension. If at least one file exists, exits 0 (allow stop). If none
 * found, exits 2 with an error on stderr (block stop).
 */

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
                'directory': { type: 'string' },
                'extension': { type: 'string' }
            },
            strict: false
        });

        if (!values.directory || !values.extension) {
            console.error("Missing required arguments: --directory and --extension");
            process.exit(2);
        }

        let hookInput: any = {};
        try {
            const stdinStr = await readStdin();
            if (stdinStr.trim()) {
                hookInput = JSON.parse(stdinStr);
            }
        } catch (e) {
            // ignore
        }

        const cwd = hookInput.cwd || '.';
        const directory = values.directory as string;
        const searchDir = path.resolve(cwd, directory);

        if (!fs.existsSync(searchDir) || !fs.statSync(searchDir).isDirectory()) {
            // Directory doesn't exist — this validator is a no-op outside of /plan_w_team
            process.exit(0);
        }

        const extensionStr = values.extension as string;
        const ext = extensionStr.startsWith('.') ? extensionStr : `.${extensionStr}`;

        const files = fs.readdirSync(searchDir);
        const matchingFiles = files.filter(f => f.endsWith(ext));

        if (matchingFiles.length === 0) {
            console.error(`No ${ext} files found in '${directory}'`);
            process.exit(2);
        }

        process.exit(0);
    } catch (e) {
        process.exit(2);
    }
}

if (require.main === module) {
    main();
}
