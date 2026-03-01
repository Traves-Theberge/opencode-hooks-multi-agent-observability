import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

/**
 * Stop hook validator: checks that files in a directory contain required strings.
 *
 * Usage:
 *     bun run .opencode/hooks/validators/validate_file_contains.ts \
 *         --directory specs --extension .md \
 *         --contains '## Task Description' \
 *         --contains '## Objective'
 *
 * Reads the Stop hook JSON from stdin. Finds the most recently modified file
 * matching the extension in the directory, then checks it contains all
 * required strings. Exits 0 if all found, exits 2 with missing sections on stderr.
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
        const args = process.argv.slice(2);
        const values: any = { contains: [] };

        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--directory' && i + 1 < args.length) {
                values.directory = args[++i];
            } else if (args[i] === '--extension' && i + 1 < args.length) {
                values.extension = args[++i];
            } else if (args[i] === '--contains' && i + 1 < args.length) {
                values.contains.push(args[++i]);
            }
        }

        if (!values.directory || !values.extension || values.contains.length === 0) {
            console.error("Missing required arguments: --directory, --extension, and at least one --contains");
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
        const searchDir = path.resolve(cwd, values.directory);

        if (!fs.existsSync(searchDir) || !fs.statSync(searchDir).isDirectory()) {
            // Directory doesn't exist — this validator is a no-op outside of /plan_w_team
            process.exit(0);
        }

        const ext = values.extension.startsWith('.') ? values.extension : `.${values.extension}`;

        const files = fs.readdirSync(searchDir);
        const matchingFiles = files
            .filter(f => f.endsWith(ext))
            .map(f => {
                const fullPath = path.join(searchDir, f);
                return { name: f, fullPath, mtime: fs.statSync(fullPath).mtimeMs };
            })
            .sort((a, b) => b.mtime - a.mtime); // Sort by most recently modified

        if (matchingFiles.length === 0) {
            console.error(`No ${ext} files found in '${values.directory}'`);
            process.exit(2);
        }

        // Check the most recently modified file
        const targetFile = matchingFiles[0];
        const content = fs.readFileSync(targetFile.fullPath, 'utf-8');

        const missing = values.contains.filter((s: string) => !content.includes(s));

        if (missing.length > 0) {
            console.error(`File '${targetFile.name}' is missing required sections:`);
            for (const section of missing) {
                console.error(`  - ${section}`);
            }
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
