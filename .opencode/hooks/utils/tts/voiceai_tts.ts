import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const playSound = require('play-sound')({});

/**
 * Speak text using Voice.ai TTS API.
 * Uses the voiceai-tts-v1-latest model with Bearer token authentication.
 *
 * @param text The text to speak
 * @param voice Optional voice ID (defaults to 'alloy')
 */
async function speak(text: string, voice: string = 'alloy'): Promise<void> {
    const apiKey = process.env.VOICEAI_API_KEY;
    if (!apiKey) {
        console.error("VOICEAI_API_KEY not set");
        process.exit(1);
    }

    try {
        const response = await fetch('https://dev.voice.ai/api/v1/tts/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'voiceai-tts-v1-latest',
                input: text,
                voice: voice,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Voice.ai API error: ${response.status} - ${errorText}`);
            process.exit(1);
        }

        const audioBuffer = await response.arrayBuffer();
        const tmpFile = path.join(os.tmpdir(), `voiceai_tts_${Date.now()}.mp3`);
        fs.writeFileSync(tmpFile, Buffer.from(audioBuffer));

        await new Promise<void>((resolve, reject) => {
            playSound.play(tmpFile, (err: Error | null) => {
                try { fs.unlinkSync(tmpFile); } catch (e) { }
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } catch (error) {
        console.error("Error with Voice.ai TTS:", error);
        process.exit(1);
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("Usage: bun run voiceai_tts.ts 'text to speak' [voice]");
        process.exit(1);
    }
    const text = args[0]!;
    const voice = args[1] || 'alloy';
    speak(text, voice);
}
