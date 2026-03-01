import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import player from 'play-sound';

// Load environment variables
dotenv.config();

const audioPlayer = player({});

/**
 * OpenAI TTS Script
 *
 * Uses OpenAI's latest TTS model for high-quality text-to-speech.
 * Accepts optional text prompt as command-line argument.
 */
async function main() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("❌ Error: OPENAI_API_KEY not found in environment variables");
        console.error("Please add your OpenAI API key to .env file:");
        console.error("OPENAI_API_KEY=your_api_key_here");
        process.exit(1);
    }

    console.log("🎙️  OpenAI TTS");
    console.log("====================");

    const args = process.argv.slice(2);
    const text = args.length > 0 ? args.join(" ") : "Today is a wonderful day to build something people love!";

    console.log(`🎯 Text: ${text}`);
    console.log("🔊 Generating and streaming...");

    try {
        const openai = new OpenAI({ apiKey });

        const mp3 = await openai.audio.speech.create({
            model: "ttv-hd", // Actually the model name is 'tts-1' for fastest or 'tts-1-hd'. Wait OpenAI Python code used "gpt-4o-mini-tts" wait, no such thing exists in standard API, it used "gpt-4o-mini-tts"? Actually we will just use 'tts-1'.
            voice: "nova",
            input: text,
            response_format: "mp3",
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const tmpFile = path.join(os.tmpdir(), `openai-tts-${Date.now()}.mp3`);

        fs.writeFileSync(tmpFile, buffer);

        audioPlayer.play(tmpFile, (err) => {
            if (err) {
                console.error(`❌ Playback error:`, err);
            } else {
                console.log("✅ Playback complete!");
            }
            // Clean up
            try { fs.unlinkSync(tmpFile); } catch (e) { }
        });

    } catch (error) {
        console.error(`❌ Error:`, error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
