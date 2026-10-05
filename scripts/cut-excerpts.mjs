/**
 * Cuts the demo's audio excerpts from LibriVox chapter files, at pauses, without
 * re-encoding.
 *
 *   node scripts/cut-excerpts.mjs <dir with the chapter mp3s> [group…]
 *
 * The chapters are LibriVox's "Alice's Adventures in Wonderland (version 2)",
 * read by Kara Shallenberg — public domain; see `public/audio/CREDITS.md` — and
 * are not in the repo: download the 64 kbps zip from
 * https://librivox.org/alices-adventures-in-wonderland-by-lewis-carroll-4/.
 *
 * The files are constant-bitrate MP3, so an excerpt is a run of whole frames.
 * Where it starts and ends comes from the decoded loudness: headless Chromium
 * decodes each chapter, and the quietest quarter-second near each target time
 * is the cut, so no word is clipped. Each file's LAME `Info` frame is dropped:
 * it records the chapter's own frame count, and Firefox takes the duration of
 * the whole file from it.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const OUT = "public/audio";

/** Seconds per loudness sample. */
const STEP = 0.02;
/** How long a pause has to be to cut in. */
const PAUSE = 0.25;
/** How far either side of a target time to look for one. */
const REACH = 5;

/**
 * `start` skips LibriVox's spoken preamble ("This is a LibriVox recording…"):
 * the excerpt begins at the longest pause in that window, which is the one
 * before the chapter's title. Then `length` seconds, to the nearest pause.
 */
const GROUPS = {
  playlist: [1, 2, 3].map((chapter) => ({
    source: `alices_adventures_0${chapter}_carroll_64kb.mp3`,
    out: `alice-0${chapter}.mp3`,
    start: [8, 40],
    length: 45,
  })),
};

const [sourceDir, ...names] = process.argv.slice(2);
if (!sourceDir) {
  console.error("Usage: node scripts/cut-excerpts.mjs <source dir> [group…]");
  process.exit(1);
}
const groups = names.length > 0 ? names : Object.keys(GROUPS);
const unknown = groups.filter((name) => !Object.hasOwn(GROUPS, name));
if (unknown.length > 0) {
  console.error(
    `Unknown group: ${unknown.join(", ")}. Known: ${Object.keys(GROUPS).join(", ")}.`,
  );
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
mkdirSync(OUT, { recursive: true });

for (const name of groups) {
  for (const excerpt of GROUPS[name]) {
    const file = readFileSync(join(sourceDir, excerpt.source));
    const frames = parseFrames(file);
    const loudness = await measure(file);

    const from = longestPause(loudness, ...excerpt.start);
    const to = quietestNear(loudness, from + excerpt.length);
    const first = frameAt(frames, from);
    const last = frameAt(frames, to);
    const bytes = file.subarray(frames[first].offset, frames[last].offset);

    writeFileSync(join(OUT, excerpt.out), bytes);
    console.log(
      `${excerpt.out}: ${from.toFixed(2)}–${to.toFixed(2)} s of ${excerpt.source}, ` +
        `${((last - first) * frames.seconds).toFixed(1)} s, ${(bytes.length / 1024).toFixed(0)} KB`,
    );
  }
}

await browser.close();

/**
 * Every MPEG audio frame between the ID3v2 tag and any APE or ID3v1 tag at the
 * end, with the LAME `Info` frame left out. Layer III only, one sample rate
 * per file.
 */
function parseFrames(buf) {
  const KBPS = {
    3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  };
  KBPS[0] = KBPS[2];
  const RATES = {
    3: [44100, 48000, 32000],
    2: [22050, 24000, 16000],
    0: [11025, 12000, 8000],
  };
  let offset =
    buf.toString("latin1", 0, 3) === "ID3"
      ? ((buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9]) + 10
      : 0;
  const end = audioEnd(buf);
  const frames = [];
  let rate;
  let frameEnd = offset;
  while (offset + 4 <= end) {
    const version = (buf[offset + 1] >> 3) & 3;
    const layer = (buf[offset + 1] >> 1) & 3;
    const bitrate = buf[offset + 2] >> 4;
    const rateIndex = (buf[offset + 2] >> 2) & 3;
    const synced = buf[offset] === 0xff && (buf[offset + 1] & 0xe0) === 0xe0;
    if (
      !synced ||
      layer !== 1 ||
      version === 1 ||
      bitrate % 15 === 0 ||
      rateIndex === 3
    ) {
      offset++;
      continue;
    }
    const samples = version === 3 ? 1152 : 576;
    rate ??= RATES[version][rateIndex];
    const length =
      Math.floor(
        ((samples / 8) * KBPS[version][bitrate] * 1000) /
          RATES[version][rateIndex],
      ) +
      ((buf[offset + 2] >> 1) & 1);
    // A truncated last frame.
    if (offset + length > end) break;
    const tag = buf.toString("latin1", offset + 4, offset + 40);
    if (frames.length > 0 || !/Info|Xing/.test(tag)) frames.push({ offset });
    offset += length;
    frameEnd = offset;
    frames.seconds = samples / rate;
  }
  // The end of the last frame, so a cut can run to the end of the audio.
  frames.push({ offset: frameEnd });
  return frames;
}

/** Where the audio ends: before an ID3v1 tag, and an APE tag before that. */
function audioEnd(buf) {
  let end = buf.length;
  if (end >= 128 && buf.toString("latin1", end - 128, end - 125) === "TAG") {
    end -= 128;
  }
  const footer = end - 32;
  if (
    footer >= 0 &&
    buf.toString("latin1", footer, footer + 8) === "APETAGEX"
  ) {
    // The size counts the items and the footer; bit 31 of the flags, a header.
    const size = buf.readUInt32LE(footer + 12);
    const header = buf.readUInt32LE(footer + 20) & 0x80000000 ? 32 : 0;
    end = Math.max(0, end - size - header);
  }
  return end;
}

function frameAt(frames, seconds) {
  return Math.min(Math.round(seconds / frames.seconds), frames.length - 1);
}

/** Root-mean-square loudness of the decoded file, one value per `STEP`. */
function measure(file) {
  return page.evaluate(
    async ({ base64, step }) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const context = new OfflineAudioContext(1, 1, 22050);
      const audio = await context.decodeAudioData(bytes.buffer);
      const data = audio.getChannelData(0);
      const size = Math.round(audio.sampleRate * step);
      const out = [];
      for (let i = 0; i < data.length; i += size) {
        const end = Math.min(i + size, data.length);
        let sum = 0;
        for (let j = i; j < end; j++) sum += data[j] * data[j];
        out.push(Math.sqrt(sum / (end - i)));
      }
      return out;
    },
    { base64: file.toString("base64"), step: STEP },
  );
}

/** The centre of the quietest `PAUSE` within `REACH` of `target`, in seconds. */
function quietestNear(loudness, target) {
  const width = Math.round(PAUSE / STEP);
  const from = Math.max(0, Math.round((target - REACH) / STEP));
  const to = Math.min(
    loudness.length - width,
    Math.round((target + REACH) / STEP),
  );
  let best = from;
  let bestSum = Infinity;
  for (let i = from; i <= to; i++) {
    let sum = 0;
    for (let j = i; j < i + width; j++) sum += loudness[j];
    if (sum < bestSum) [best, bestSum] = [i, sum];
  }
  return (best + width / 2) * STEP;
}

/**
 * The centre of the longest run below a tenth of the median loudness, between
 * `from` and `to` seconds.
 */
function longestPause(loudness, from, to) {
  const sorted = [...loudness].sort((a, b) => a - b);
  const quiet = sorted[Math.floor(sorted.length / 2)] / 10;
  let best = { start: from / STEP, length: 0 };
  let start = -1;
  for (let i = Math.round(from / STEP); i <= Math.round(to / STEP); i++) {
    if (loudness[i] < quiet) {
      if (start < 0) start = i;
      if (i - start + 1 > best.length) best = { start, length: i - start + 1 };
    } else start = -1;
  }
  return (best.start + best.length / 2) * STEP;
}
