// Writes public/test-tone.wav, the track the demo app and the E2E suite load.
//
// WAV rather than MP3 because uncompressed PCM is the one format no engine
// needs a system codec for. Linux Firefox decodes MP3 through the platform's
// FFmpeg, which a CI runner may not have — and the failure is quiet: the
// container still parses, so `duration` and seeking work and only playback
// never advances.
//
// Mono at 22.05 kHz, which is small without being unusual. Do not lower it
// further without re-checking a seek to exactly `duration`, which the End key
// performs: at 8 kHz Firefox answers that seek with MEDIA_ERR_DECODE and then
// leaves `seeking` stuck true. 22.05 kHz and 44.1 kHz are both clean.
//
// A minute is the floor for the length. `time-display.spec.ts` seeks to 40 s.
//
//   node scripts/generate-test-tone.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const DURATION_S = 60;

const FREQUENCY_HZ = 220;
const AMPLITUDE = 0.1;

const frameCount = SAMPLE_RATE * DURATION_S;
const bytesPerFrame = (BITS_PER_SAMPLE / 8) * CHANNELS;
const dataSize = frameCount * bytesPerFrame;

const header = Buffer.alloc(44);
header.write("RIFF", 0, "ascii");
header.writeUInt32LE(36 + dataSize, 4);
header.write("WAVE", 8, "ascii");
header.write("fmt ", 12, "ascii");
header.writeUInt32LE(16, 16); // fmt chunk size
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(CHANNELS, 22);
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * bytesPerFrame, 28); // byte rate
header.writeUInt16LE(bytesPerFrame, 32); // block align
header.writeUInt16LE(BITS_PER_SAMPLE, 34);
header.write("data", 36, "ascii");
header.writeUInt32LE(dataSize, 40);

const samples = Buffer.alloc(dataSize);
for (let frame = 0; frame < frameCount; frame += 1) {
  const angle = (2 * Math.PI * FREQUENCY_HZ * frame) / SAMPLE_RATE;
  samples.writeInt16LE(
    Math.round(Math.sin(angle) * AMPLITUDE * 32767),
    frame * bytesPerFrame,
  );
}

const out = fileURLToPath(new URL("../public/test-tone.wav", import.meta.url));
writeFileSync(out, Buffer.concat([header, samples]));
console.log(`${out} — ${DURATION_S}s, ${(dataSize / 1e6).toFixed(2)} MB`);
