import * as fs from 'fs';
import * as process from 'process';
import { parseArgs } from 'util';
import { getModelFromTranscript } from './utils/model_extractor';
import { generateEventSummary } from './utils/summarizer';

/**
 * Multi-Agent Observability Hook Script
 * Sends OpenCode hook events to the observability server.
 */

async function sendEventToServer(eventData: any, serverUrl: string = 'http://localhost:4000/events'): Promise<boolean> {
    try {
        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'OpenCode-Code-Hook/1.0'
            },
            body: JSON.stringify(eventData),
            // Set 5-second timeout in fetch using AbortController
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            return true;
        } else {
            console.error(`Server returned status: ${response.status}`);
            return false;
        }
    } catch (e) {
        console.error(`Failed to send event: ${e}`);
        return false;
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
    const defaultServerUrl = 'http://localhost:4000/events';

    // Parse command line arguments
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: {
            'source-app': { type: 'string' },
            'event-type': { type: 'string' },
            'server-url': { type: 'string', default: defaultServerUrl },
            'add-chat': { type: 'boolean', default: false },
            'summarize': { type: 'boolean', default: false }
        }
    });

    if (!values['source-app'] || !values['event-type']) {
        console.error("Missing required arguments: --source-app and --event-type");
        process.exit(1);
    }

    let inputData: any;
    try {
        const stdinStr = await readStdin();
        if (!stdinStr.trim()) {
            // No input given, just exit cleanly
            process.exit(0);
        }
        inputData = JSON.parse(stdinStr);
    } catch (e) {
        console.error(`Failed to parse JSON input: ${e}`);
        process.exit(1);
    }

    const sessionId = inputData.session_id || 'unknown';
    let transcriptPath = inputData.transcript_path || '';
    let modelName = '';

    if (transcriptPath) {
        modelName = getModelFromTranscript(sessionId, transcriptPath);
    }

    const eventData: any = {
        source_app: values['source-app'],
        session_id: sessionId,
        hook_event_type: values['event-type'],
        payload: inputData,
        timestamp: Date.now(),
        model_name: modelName
    };

    // Forward event-specific fields
    const forwardFields = [
        'tool_name', 'tool_use_id', 'error', 'is_interrupt',
        'permission_suggestions', 'agent_id', 'agent_type',
        'agent_transcript_path', 'stop_hook_active', 'notification_type',
        'custom_instructions', 'source', 'reason'
    ];

    for (const field of forwardFields) {
        if (field in inputData) {
            eventData[field] = inputData[field];
        }
    }

    // Handle --add-chat option
    if (values['add-chat'] && transcriptPath) {
        if (fs.existsSync(transcriptPath)) {
            try {
                const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
                const chatData = [];
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            chatData.push(JSON.parse(line));
                        } catch (e) { }
                    }
                }
                eventData.chat = chatData;
            } catch (e) {
                console.error(`Failed to read transcript: ${e}`);
            }
        }
    }

    // Generate summary if requested
    if (values['summarize']) {
        const summary = await generateEventSummary(eventData);
        if (summary) {
            eventData.summary = summary;
        }
    }

    // Send to server
    await sendEventToServer(eventData, values['server-url'] as string);

    // Always exit with 0 to not block operations
    process.exit(0);
}

if (require.main === module) {
    main().catch(err => {
        console.error(`Unexpected error: ${err}`);
        process.exit(0); // Exit 0 to not break OpenCode
    });
}
