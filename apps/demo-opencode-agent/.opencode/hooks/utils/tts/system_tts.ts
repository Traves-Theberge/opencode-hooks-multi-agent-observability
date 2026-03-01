import * as process from 'process';

// Load say module. Using require as it might lack typescript definitions.
const say = require('say');

/**
 * System TTS Script
 *
 * Uses the native OS text-to-speech synthesis via the `say` npm package.
 * Accepts optional text prompt as command-line argument.
 */
function main() {
    console.log("🎙️  System TTS");
    console.log("===============");

    const args = process.argv.slice(2);
    let text = "";

    if (args.length > 0) {
        text = args.join(" ");
    } else {
        const completionMessages = [
            "Work complete!",
            "All done!",
            "Task finished!",
            "Job complete!",
            "Ready for next task!"
        ];
        // Pick a random message
        text = completionMessages[Math.floor(Math.random() * completionMessages.length)];
    }

    console.log(`🎯 Text: ${text}`);
    console.log("🔊 Speaking...");

    // Speak the text
    say.speak(text, null, 1.0, (err: any) => {
        if (err) {
            console.error(`❌ Error: ${err}`);
            process.exit(1);
        } else {
            console.log("✅ Playback complete!");
        }
    });
}

if (require.main === module) {
    main();
}
