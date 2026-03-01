import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { ensureSessionLogDir } from './utils/constants';

// Allowed directories where rm -rf is permitted
const ALLOWED_RM_DIRECTORIES = [
    'trees/',
];

function isPathInAllowedDirectory(command: string, allowedDirs: string[]): boolean {
    const pathPattern = /rm\s+(?:-[\w]+\s+|--[\w-]+\s+)*(.+)$/i;
    const match = command.match(pathPattern);

    if (!match || !match[1]) {
        return false;
    }

    const pathStr = match[1].trim();
    const paths = pathStr.split(/\s+/);

    if (paths.length === 0) {
        return false;
    }

    for (let currentPath of paths) {
        currentPath = currentPath.replace(/^['"]|['"]$/g, '');

        if (!currentPath) {
            continue;
        }

        let isAllowed = false;
        for (const allowedDir of allowedDirs) {
            if (currentPath.startsWith(allowedDir) || currentPath.startsWith('./' + allowedDir)) {
                isAllowed = true;
                break;
            }
        }

        if (!isAllowed) {
            return false;
        }
    }

    return true;
}

function isDangerousRmCommand(command: string, allowedDirs: string[] = []): boolean {
    const normalized = command.toLowerCase().replace(/\s+/g, ' ').trim();

    const patterns = [
        /\brm\s+.*-[a-z]*r[a-z]*f/,
        /\brm\s+.*-[a-z]*f[a-z]*r/,
        /\brm\s+--recursive\s+--force/,
        /\brm\s+--force\s+--recursive/,
        /\brm\s+-r\s+.*-f/,
        /\brm\s+-f\s+.*-r/,
    ];

    let isPotentiallyDangerous = false;
    for (const pattern of patterns) {
        if (pattern.test(normalized)) {
            isPotentiallyDangerous = true;
            break;
        }
    }

    if (!isPotentiallyDangerous) {
        const dangerousPaths = [
            /\//,
            /\/\*/,
            /~/,
            /~\//,
            /\$HOME/,
            /\.\./,
            /\*/,
            /\./,
            /\.\s*$/,
        ];

        if (/\brm\s+.*-[a-z]*r/.test(normalized)) {
            for (const dangerousPath of dangerousPaths) {
                if (dangerousPath.test(normalized)) {
                    isPotentiallyDangerous = true;
                    break;
                }
            }
        }
    }

    if (!isPotentiallyDangerous) {
        return false;
    }

    if (allowedDirs.length > 0 && isPathInAllowedDirectory(command, allowedDirs)) {
        return false;
    }

    return true;
}

// NOTE: Currently unused, but preserved from Python
function isEnvFileAccess(toolName: string, toolInput: any): boolean {
    if (['Read', 'Edit', 'MultiEdit', 'Write', 'Bash'].includes(toolName)) {
        if (['Read', 'Edit', 'MultiEdit', 'Write'].includes(toolName)) {
            const filePath = toolInput.file_path || '';
            if (filePath.includes('.env') && !filePath.endsWith('.env.sample')) {
                return true;
            }
        } else if (toolName === 'Bash') {
            const command = toolInput.command || '';
            const envPatterns = [
                /\b\.env\b(?!\.sample)/,
                /cat\s+.*\.env\b(?!\.sample)/,
                /echo\s+.*>\s*\.env\b(?!\.sample)/,
                /touch\s+.*\.env\b(?!\.sample)/,
                /cp\s+.*\.env\b(?!\.sample)/,
                /mv\s+.*\.env\b(?!\.sample)/,
            ];

            for (const pattern of envPatterns) {
                if (pattern.test(command)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function denyTool(reason: string) {
    const output = {
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: reason
        }
    };
    console.log(JSON.stringify(output));
    process.exit(0);
}

function summarizeToolInput(toolName: string, toolInput: any): any {
    const summary: any = { tool_name: toolName };

    if (toolName === 'Bash') {
        summary.command = (toolInput.command || "").substring(0, 200);
        if (toolInput.description) summary.description = toolInput.description.substring(0, 100);
        if (toolInput.timeout !== undefined) summary.timeout = toolInput.timeout;
        if (toolInput.run_in_background) summary.run_in_background = true;
    } else if (toolName === 'Write') {
        summary.file_path = toolInput.file_path || "";
        summary.content_length = (toolInput.content || "").length;
    } else if (toolName === 'Edit') {
        summary.file_path = toolInput.file_path || "";
        summary.replace_all = toolInput.replace_all || false;
    } else if (toolName === 'Read') {
        summary.file_path = toolInput.file_path || "";
        if (toolInput.offset !== undefined) summary.offset = toolInput.offset;
        if (toolInput.limit !== undefined) summary.limit = toolInput.limit;
    } else if (toolName === 'Glob' || toolName === 'Grep') {
        summary.pattern = toolInput.pattern || "";
        if (toolInput.path) summary.path = toolInput.path;
        if (toolName === 'Grep' && toolInput.glob) summary.glob = toolInput.glob;
    } else if (toolName === 'WebFetch') {
        summary.url = toolInput.url || "";
        summary.prompt = (toolInput.prompt || "").substring(0, 100);
    } else if (toolName === 'WebSearch') {
        summary.query = toolInput.query || "";
        if (toolInput.allowed_domains) summary.allowed_domains = toolInput.allowed_domains;
        if (toolInput.blocked_domains) summary.blocked_domains = toolInput.blocked_domains;
    } else if (toolName === 'Task') {
        summary.description = (toolInput.description || "").substring(0, 100);
        summary.subagent_type = toolInput.subagent_type || "";
        if (toolInput.model) summary.model = toolInput.model;
        if (toolInput.run_in_background) summary.run_in_background = true;
        if (toolInput.resume) summary.resume = toolInput.resume;
    } else if (toolName === 'TaskOutput') {
        summary.task_id = toolInput.task_id || "";
        summary.block = toolInput.block !== undefined ? toolInput.block : true;
        if (toolInput.timeout !== undefined) summary.timeout = toolInput.timeout;
    } else if (toolName === 'TaskStop' || toolName === 'TaskGet' || toolName === 'TaskUpdate') {
        summary.taskId = toolInput.taskId || toolInput.task_id || "";
        if (toolName === 'TaskUpdate') {
            if (toolInput.status) summary.status = toolInput.status;
            if (toolInput.owner) summary.owner = toolInput.owner;
        }
    } else if (toolName === 'SendMessage') {
        summary.type = toolInput.type || "";
        if (toolInput.recipient) summary.recipient = toolInput.recipient;
        if (toolInput.summary) summary.summary = toolInput.summary;
    } else if (toolName === 'TaskCreate') {
        summary.subject = (toolInput.subject || "").substring(0, 100);
        if (toolInput.activeForm) summary.activeForm = toolInput.activeForm;
    } else if (toolName === 'TeamCreate') {
        summary.team_name = toolInput.team_name || "";
        if (toolInput.description) summary.description = toolInput.description.substring(0, 100);
    } else if (toolName === 'NotebookEdit') {
        summary.notebook_path = toolInput.notebook_path || "";
        if (toolInput.cell_type) summary.cell_type = toolInput.cell_type;
        if (toolInput.edit_mode) summary.edit_mode = toolInput.edit_mode;
    } else if (toolName === 'ExitPlanMode') {
        if (toolInput.allowedPrompts) summary.allowedPrompts_count = toolInput.allowedPrompts.length;
    } else if (toolName === 'AskUserQuestion') {
        if (toolInput.questions) summary.questions_count = toolInput.questions.length;
    } else if (toolName === 'Skill') {
        summary.skill = toolInput.skill || "";
        if (toolInput.args) summary.args = toolInput.args.substring(0, 100);
    } else if (toolName.startsWith('mcp__')) {
        summary.mcp_tool = toolName;
        summary.input_keys = Object.keys(toolInput).slice(0, 10);
    }

    return summary;
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
        const stdinStr = await readStdin();
        if (!stdinStr.trim()) process.exit(0);

        const inputData = JSON.parse(stdinStr);

        const toolName = inputData.tool_name || '';
        const toolInput = inputData.tool_input || {};
        const toolUseId = inputData.tool_use_id || '';

        // Check for .env file access (blocks access to sensitive environment files)
        // COMMENTED OUT: Allows worktree command to create .env files automatically
        // if (isEnvFileAccess(toolName, toolInput)) {
        //     denyTool("Access to .env files containing sensitive data is prohibited. Use .env.sample for template files instead");
        // }

        if (toolName === 'Bash') {
            const command = toolInput.command || '';
            if (isDangerousRmCommand(command, ALLOWED_RM_DIRECTORIES)) {
                denyTool(`Dangerous rm command detected and prevented. rm -rf is only allowed in these directories: ${ALLOWED_RM_DIRECTORIES.join(', ')}`);
            }
        }

        const sessionId = inputData.session_id || 'unknown';
        const logDir = ensureSessionLogDir(sessionId);
        const logPath = path.join(logDir, 'pre_tool_use.json');

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
            tool_name: toolName,
            tool_use_id: toolUseId,
            session_id: sessionId,
            hook_event_name: inputData.hook_event_name || 'PreToolUse',
            tool_summary: summarizeToolInput(toolName, toolInput),
        };

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
