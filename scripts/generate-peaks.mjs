/**
 * Writes the waveform example's peaks: one loudness value per bar, `0`–`1`.
 *
 *   node scripts/generate-peaks.mjs
 *
 * Headless Chromium decodes `public/The-Race.mp3`, so there is no ffmpeg to
 * install, and the example draws from a few hundred numbers instead of fetching
 * and decoding the track a second time at runtime.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const SOURCE = "public/The-Race.mp3";
const OUT = "examples/waveform/src/peaks.json";
const BARS = 160;

const browser = await chromium.launch();
const page = await browser.newPage();

const peaks = await page.evaluate(
  async ({ base64, bars }) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const context = new OfflineAudioContext(1, 1, 44100);
    const audio = await context.decodeAudioData(bytes.buffer);
    const channels = Array.from({ length: audio.numberOfChannels }, (_, i) =>
      audio.getChannelData(i),
    );
    const size = Math.floor(audio.length / bars);
    const out = [];
    for (let bar = 0; bar < bars; bar++) {
      let sum = 0;
      for (let i = bar * size; i < (bar + 1) * size; i++) {
        let sample = 0;
        for (const data of channels) sample += data[i];
        sample /= channels.length;
        sum += sample * sample;
      }
      out.push(sum / size);
    }
    return out;
  },
  { base64: readFileSync(SOURCE).toString("base64"), bars: BARS },
);

await browser.close();

// Mean power rather than the maximum or the RMS: a mastered track peaks near
// full scale almost everywhere, and its RMS barely moves, so either would draw
// bars of one height.
const loudest = Math.max(...peaks);
const normalised = peaks.map(
  (peak) => Math.round((peak / loudest) * 100) / 100,
);

writeFileSync(OUT, `${JSON.stringify(normalised)}\n`);
console.log(`${OUT}: ${BARS} bars from ${SOURCE}`);
