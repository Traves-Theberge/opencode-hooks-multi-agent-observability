import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as process from 'process';
import { spawnSync } from 'child_process';

/**
 * Video Processor - A unified CLI tool for video/audio processing and transcription.
 * 
 * Requirements:
 * - FFmpeg must be installed on the system
 * - OpenAI Whisper must be installed (pip install openai-whisper)
 */

function checkFfmpeg(): boolean {
    const result = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
    return result.status === 0;
}

function checkWhisper(): boolean {
    const result = spawnSync('whisper', ['--help'], { encoding: 'utf8' });
    return result.status === 0;
}

function validateInputFile(filePath: string): string {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
        console.error(`Input file does not exist: ${filePath}`);
        process.exit(1);
    }
    if (!fs.statSync(fullPath).isFile()) {
        console.error(`Input path is not a file: ${filePath}`);
        process.exit(1);
    }
    return fullPath;
}

function extractAudio(inputFile: string, outputFile: string, format: string = 'wav') {
    if (!checkFfmpeg()) {
        console.error("FFmpeg is not installed. Please install it.");
        process.exit(1);
    }

    const inputPath = validateInputFile(inputFile);
    let outputPath = path.resolve(outputFile);

    if (!path.extname(outputPath)) {
        outputPath += `.${format}`;
    }

    console.log(`Extracting audio from ${inputPath}...`);
    console.log(`Output format: ${format}`);

    const acodec = format === 'wav' ? 'pcm_s16le' : format;
    const args = ['-i', inputPath, '-vn', '-acodec', acodec, '-y', outputPath];

    const result = spawnSync('ffmpeg', args, { encoding: 'utf8' });

    if (result.status === 0) {
        console.log(`✓ Audio extracted successfully to ${outputPath}`);
        console.log(`File size: ${(fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)} MB`);
    } else {
        console.error(`FFmpeg error during audio extraction:\n${result.stderr}`);
        process.exit(1);
    }
}

function toMp4(inputFile: string, outputFile: string, codec: string = 'libx264', preset: string = 'medium', crf: number = 23) {
    if (!checkFfmpeg()) {
        console.error("FFmpeg is not installed. Please install it.");
        process.exit(1);
    }

    const inputPath = validateInputFile(inputFile);
    let outputPath = path.resolve(outputFile);

    if (path.extname(outputPath).toLowerCase() !== '.mp4') {
        outputPath = outputPath.replace(path.extname(outputPath), '') + '.mp4';
    }

    console.log(`Converting ${inputPath} to MP4...`);
    console.log(`Codec: ${codec}, Preset: ${preset}, CRF: ${crf}`);

    const args = [
        '-i', inputPath,
        '-vcodec', codec,
        '-preset', preset,
        '-crf', crf.toString(),
        '-acodec', 'aac',
        '-b:a', '128k',
        '-y', outputPath
    ];

    const result = spawnSync('ffmpeg', args, { encoding: 'utf8' });

    if (result.status === 0) {
        console.log(`✓ Video converted successfully to ${outputPath}`);
        console.log(`File size: ${(fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)} MB`);
    } else {
        console.error(`FFmpeg error during MP4 conversion:\n${result.stderr}`);
        process.exit(1);
    }
}

function toWebm(inputFile: string, outputFile: string, codec: string = 'libvpx-vp9', crf: number = 30, bitrate: string = '1M') {
    if (!checkFfmpeg()) {
        console.error("FFmpeg is not installed. Please install it.");
        process.exit(1);
    }

    const inputPath = validateInputFile(inputFile);
    let outputPath = path.resolve(outputFile);

    if (path.extname(outputPath).toLowerCase() !== '.webm') {
        outputPath = outputPath.replace(path.extname(outputPath), '') + '.webm';
    }

    console.log(`Converting ${inputPath} to WebM...`);
    console.log(`Codec: ${codec}, CRF: ${crf}, Bitrate: ${bitrate}`);

    const args = [
        '-i', inputPath,
        '-vcodec', codec,
        '-crf', crf.toString(),
        '-b:v', bitrate,
        '-acodec', 'libopus',
        '-b:a', '128k',
        '-y', outputPath
    ];

    const result = spawnSync('ffmpeg', args, { encoding: 'utf8' });

    if (result.status === 0) {
        console.log(`✓ Video converted successfully to ${outputPath}`);
        console.log(`File size: ${(fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)} MB`);
    } else {
        console.error(`FFmpeg error during WebM conversion:\n${result.stderr}`);
        process.exit(1);
    }
}

function transcribe(inputFile: string, outputFile: string, model: string = 'base', language: string | null = null, outputFormat: string = 'txt', verbose: boolean = false) {
    if (!checkFfmpeg()) {
        console.error("FFmpeg is not installed. Please install it.");
        process.exit(1);
    }
    if (!checkWhisper()) {
        console.error("OpenAI Whisper is not installed. Please install it.");
        process.exit(1);
    }

    const inputPath = validateInputFile(inputFile);
    const outputPath = path.resolve(outputFile);

    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'];
    const audioExtensions = ['.wav', '.mp3', '.aac', '.flac', '.m4a', '.ogg'];

    const ext = path.extname(inputPath).toLowerCase();

    let tempAudio: string | null = null;
    let audioFile = inputPath;

    if (videoExtensions.includes(ext)) {
        console.log("Input is video file - extracting audio first...");
        tempAudio = path.join(os.tmpdir(), `temp_audio_${Date.now()}.wav`);
        audioFile = tempAudio;

        const args = ['-i', inputPath, '-acodec', 'pcm_s16le', '-ac', '1', '-ar', '16000', '-vn', '-y', tempAudio];
        const result = spawnSync('ffmpeg', args, { encoding: 'utf8' });

        if (result.status === 0) {
            console.log("✓ Audio extracted to temporary file");
        } else {
            if (fs.existsSync(tempAudio)) fs.unlinkSync(tempAudio);
            console.error(`FFmpeg error during audio extraction:\n${result.stderr}`);
            process.exit(1);
        }
    } else if (!audioExtensions.includes(ext)) {
        console.error(`Unsupported file format: ${ext}`);
        process.exit(1);
    }

    console.log(`Transcribing with Whisper (model: ${model})...`);
    console.log(`Language: ${language || 'auto-detect'}`);

    const whisperArgs = [
        audioFile,
        '--model', model,
        '--output_format', outputFormat,
        '--output_dir', path.dirname(outputPath)
    ];

    if (language) whisperArgs.push('--language', language);
    if (!verbose) {
        whisperArgs.push('--verbose', 'False');
    }

    const whisperResult = spawnSync('whisper', whisperArgs, { encoding: 'utf8', stdio: verbose ? 'inherit' : 'pipe' });

    if (whisperResult.status !== 0) {
        if (tempAudio && fs.existsSync(tempAudio)) fs.unlinkSync(tempAudio);
        console.error(`Whisper transcription error:\n${whisperResult.stderr || 'Unknown error'}`);
        process.exit(1);
    }

    let whisperOutput = path.join(path.dirname(audioFile), `${path.basename(audioFile, path.extname(audioFile))}.${outputFormat}`);

    if (!fs.existsSync(whisperOutput)) {
        whisperOutput = path.join(path.dirname(outputPath), `${path.basename(audioFile, path.extname(audioFile))}.${outputFormat}`);
    }

    if (fs.existsSync(whisperOutput) && whisperOutput !== outputPath) {
        fs.renameSync(whisperOutput, outputPath);
    }

    console.log('✓ Transcription completed successfully!');
    console.log(`Output: ${outputPath}`);

    if (fs.existsSync(outputPath)) {
        console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

        if (outputFormat === 'txt' && fs.statSync(outputPath).size < 5000) {
            console.log('\nPreview:');
            console.log('-'.repeat(50));
            const content = fs.readFileSync(outputPath, 'utf8');
            const preview = content.substring(0, 500);
            console.log(preview);
            if (content.length >= 500) console.log('...');
            console.log('-'.repeat(50));
        }
    }

    if (tempAudio && fs.existsSync(tempAudio)) {
        try {
            fs.unlinkSync(tempAudio);
            console.log('✓ Temporary audio file cleaned up');
        } catch (e) { }
    }
}

function printUsage() {
    console.log(`
Video Processor - Process videos with FFmpeg and Whisper.

Commands:
  extract-audio [input_file] [output_file]  Extract audio from video. Options: --format wav/mp3/aac/flac
  to-mp4 [input_file] [output_file]         Convert video to MP4. Options: --codec, --preset, --crf
  to-webm [input_file] [output_file]        Convert video to WebM. Options: --codec, --crf, --bitrate
  transcribe [input_file] [output_file]     Transcribe audio/video. Options: --model, --language, --format, --verbose
    `);
}

function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        printUsage();
        process.exit(1);
    }

    const command = args[0];

    try {
        if (command === 'extract-audio') {
            const inputFile = args[1];
            const outputFile = args[2];
            let format = 'wav';
            const fIndex = args.indexOf('--format');
            if (fIndex !== -1 && fIndex + 1 < args.length) format = args[fIndex + 1];

            if (!inputFile || !outputFile) {
                console.error("Missing input or output file");
                process.exit(1);
            }
            extractAudio(inputFile, outputFile, format);
        } else if (command === 'to-mp4') {
            const inputFile = args[1];
            const outputFile = args[2];
            let codec = 'libx264', preset = 'medium', crf = 23;

            const cIndex = args.indexOf('--codec');
            if (cIndex !== -1 && cIndex + 1 < args.length) codec = args[cIndex + 1];

            const pIndex = args.indexOf('--preset');
            if (pIndex !== -1 && pIndex + 1 < args.length) preset = args[pIndex + 1];

            const crfIndex = args.indexOf('--crf');
            if (crfIndex !== -1 && crfIndex + 1 < args.length) crf = parseInt(args[crfIndex + 1]);

            if (!inputFile || !outputFile) {
                console.error("Missing input or output file");
                process.exit(1);
            }
            toMp4(inputFile, outputFile, codec, preset, crf);
        } else if (command === 'to-webm') {
            const inputFile = args[1];
            const outputFile = args[2];
            let codec = 'libvpx-vp9', crf = 30, bitrate = '1M';

            const cIndex = args.indexOf('--codec');
            if (cIndex !== -1 && cIndex + 1 < args.length) codec = args[cIndex + 1];

            const crfIndex = args.indexOf('--crf');
            if (crfIndex !== -1 && crfIndex + 1 < args.length) crf = parseInt(args[crfIndex + 1]);

            const bIndex = args.indexOf('--bitrate');
            if (bIndex !== -1 && bIndex + 1 < args.length) bitrate = args[bIndex + 1];

            if (!inputFile || !outputFile) {
                console.error("Missing input or output file");
                process.exit(1);
            }
            toWebm(inputFile, outputFile, codec, crf, bitrate);
        } else if (command === 'transcribe') {
            const inputFile = args[1];
            const outputFile = args[2];
            let model = 'base', language = null, format = 'txt', verbose = args.includes('--verbose');

            const mIndex = args.indexOf('--model');
            if (mIndex !== -1 && mIndex + 1 < args.length) model = args[mIndex + 1];

            const lIndex = args.indexOf('--language');
            if (lIndex !== -1 && lIndex + 1 < args.length) language = args[lIndex + 1];

            const fIndex = args.indexOf('--format');
            if (fIndex !== -1 && fIndex + 1 < args.length) format = args[fIndex + 1];

            if (!inputFile || !outputFile) {
                console.error("Missing input or output file");
                process.exit(1);
            }
            transcribe(inputFile, outputFile, model, language, format, verbose);
        } else {
            printUsage();
        }
    } catch (e) {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
