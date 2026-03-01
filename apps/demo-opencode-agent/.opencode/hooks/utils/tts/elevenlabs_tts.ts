import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import player from 'play-sound';

// Load environment variables
dotenv.config();

const audioPlayer = player({});

/**
 * ElevenLabs Flash v2.5 TTS Script
 *
 * Uses ElevenLabs' Flash v2.5 model for ultra-low latency text-to-speech.
 * Accepts optional text prompt as command-line argument.
 */
async function main() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        console.error("❌ Error: ELEVENLABS_API_KEY not found in environment variables");
        console.error("Please add your ElevenLabs API key to .env file:");
        console.error("ELEVENLABS_API_KEY=your_api_key_here");
        process.exit(1);
    }

    console.log("🎙️  ElevenLabs Flash v2.5 TTS");
    console.log("========================================");

    const args = process.argv.slice(2);
    const text = args.length > 0 ? args.join(" ") : "The first move is what sets everything in motion.";

    console.log(`🎯 Text: ${text}`);
    console.log("🔊 Generating and playing...");

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/WejK3H1m7MI9CHnIjW9K`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_flash_v2_5",
                output_format: "mp3_44100_128",
            })
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${await response.text()}`);
        }

        const buffer = await response.arrayBuffer();
        const tmpFile = path.join(os.tmpdir(), `elevenlabs-tts-${Date.now()}.mp3`);

        fs.writeFileSync(tmpFile, Buffer.from(buffer));

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
