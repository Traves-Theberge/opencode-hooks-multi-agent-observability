import * as http from 'http';
import * as net from 'net';

export type HitlType = 'question' | 'permission' | 'choice';

export class HITLRequest {
    public question: string;
    public hitlType: HitlType;
    public choices: string[] | null;
    public timeout: number;
    public observabilityUrl: string;
    public responsePort: number;
    public responseData: any = null;
    private server: any = null;

    constructor(
        question: string,
        hitlType: HitlType = 'question',
        choices: string[] | null = null,
        timeout: number = 300,  // 5 minutes default
        observabilityUrl: string = "http://localhost:4000"
    ) {
        this.question = question;
        this.hitlType = hitlType;
        this.choices = choices;
        this.timeout = timeout;
        this.observabilityUrl = observabilityUrl;
        this.responsePort = 0; // Will be set dynamically
    }

    private async findFreePort(): Promise<number> {
        return new Promise((resolve, reject) => {
            const server = net.createServer();
            server.unref();
            server.on('error', reject);
            server.listen(0, () => {
                const port = (server.address() as net.AddressInfo).port;
                server.close(() => resolve(port));
            });
        });
    }

    private startResponseServer(): Promise<void> {
        return new Promise((resolve) => {
            try {
                // Using Bun's native WebSocket server if available, fallback isn't needed here if we only use Bun
                this.server = Bun.serve({
                    port: this.responsePort,
                    fetch(req, server) {
                        if (server.upgrade(req)) {
                            return; // Do not return a Response
                        }
                        return new Response("Upgrade failed", { status: 500 });
                    },
                    websocket: {
                        message: (ws, message) => {
                            try {
                                this.responseData = JSON.parse(message as string);
                                ws.close();
                            } catch (e) {
                                console.error(`Error receiving HITL response: ${e}`);
                            }
                        }
                    }
                });
                resolve();
            } catch (e) {
                console.error(`Error starting WebSocket server: ${e}`);
                resolve();
            }
        });
    }

    public getHitlData(): any {
        return {
            question: this.question,
            responseWebSocketUrl: `ws://localhost:${this.responsePort}`,
            type: this.hitlType,
            choices: this.choices,
            timeout: this.timeout,
            requiresResponse: true
        };
    }

    public async sendAndWait(
        hookEventData: any,
        sessionData: any
    ): Promise<any> {
        this.responsePort = await this.findFreePort();

        const eventPayload = {
            ...sessionData,
            hook_event_type: hookEventData.hook_event_type || "HumanInTheLoop",
            payload: hookEventData.payload || {},
            humanInTheLoop: this.getHitlData(),
            timestamp: Date.now()
        };

        await this.startResponseServer();

        try {
            const response = await fetch(`${this.observabilityUrl}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventPayload),
                signal: AbortSignal.timeout(10000)
            });
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
        } catch (e) {
            console.error(`Failed to send HITL request: ${e}`);
            if (this.server) {
                this.server.stop(true);
            }
            return null;
        }

        const startTime = Date.now();
        while (this.responseData === null) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if ((Date.now() - startTime) / 1000 > this.timeout) {
                break;
            }
        }

        if (this.server) {
            this.server.stop(true);
        }

        return this.responseData;
    }
}

// Convenience functions
export async function askQuestion(
    question: string,
    sessionData: any,
    timeout: number = 300
): Promise<string | null> {
    const hitl = new HITLRequest(question, 'question', null, timeout);
    const response = await hitl.sendAndWait(
        { hook_event_type: "HumanInTheLoop", payload: {} },
        sessionData
    );
    return response ? response.response : null;
}

export async function askPermission(
    question: string,
    sessionData: any,
    timeout: number = 300
): Promise<boolean> {
    const hitl = new HITLRequest(question, 'permission', null, timeout);
    const response = await hitl.sendAndWait(
        { hook_event_type: "HumanInTheLoop", payload: {} },
        sessionData
    );
    return response ? (response.permission === true || response.permission === 'true') : false;
}

export async function askChoice(
    question: string,
    choices: string[],
    sessionData: any,
    timeout: number = 300
): Promise<string | null> {
    const hitl = new HITLRequest(question, 'choice', choices, timeout);
    const response = await hitl.sendAndWait(
        { hook_event_type: "HumanInTheLoop", payload: {} },
        sessionData
    );
    return response ? response.choice : null;
}
