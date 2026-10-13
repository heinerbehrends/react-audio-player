/**
 * Builds `public/audio/alice-podcast.vtt`, the podcast example's transcript:
 * the text from Project Gutenberg's "Alice's Adventures in Wonderland", which
 * the LibriVox reading follows word for word, and the timings from a
 * speech-recognition VTT of each excerpt. One cue per sentence; the first cue
 * of each paragraph has an id, `p1`, `p2`…
 *
 *   node scripts/build-transcript.mjs <pg11.txt> <part1.vtt> <part2.vtt> <part3.vtt>
 *
 * `pg11.txt` is https://www.gutenberg.org/ebooks/11 as plain text. Each part is
 * one excerpt of `alice-podcast.mp3`, cut at its chapter's start, run through
 * speech recognition. Its words are only matched against the book's, so their
 * spelling and punctuation do not matter; its timings are shifted by the
 * chapter's start in `examples/podcast/src/chapters.json`.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [bookPath, ...partPaths] = process.argv.slice(2);
if (!bookPath || partPaths.length !== 3) {
  console.error(
    "Usage: node scripts/build-transcript.mjs <pg11.txt> <part1.vtt> <part2.vtt> <part3.vtt>",
  );
  process.exit(1);
}

const OUT = "public/audio/alice-podcast.vtt";
const book = readFileSync(bookPath, "utf8").replace(/\r/g, "");
const starts = JSON.parse(
  readFileSync("examples/podcast/src/chapters.json", "utf8"),
).map((chapter) => chapter.start);

/** Replaces the text of the cue starting at `start`, in part-local seconds. */
const replaceCue = (start, text) => (cues) =>
  cues.map((cue) => (cue.start === start ? { ...cue, text } : cue));

const PARTS = [
  { chapter: "CHAPTER X.", next: "CHAPTER XI.", length: 115.7 },
  {
    chapter: "CHAPTER XI.",
    next: "CHAPTER XII.",
    length: 120.6,
    // Recognition faults, judged by reading the output: this cue runs on into
    // the next one's words. The invented burst before it is dropped by the
    // speed filter below.
    fix: replaceCue(
      102.66,
      "the twelve jurors were all writing very busily on slates what are they doing alice whispered to the griffin",
    ),
  },
  {
    chapter: "CHAPTER XII.",
    next: "THE END",
    length: 120.8,
    // Runs ahead of the speech; the four cues after it say the same words at
    // their real times.
    fix: replaceCue(
      101.64,
      "gazing up into the roof of the court what do you know about this business the king said to alice",
    ),
  },
].map((part, i) => ({ ...part, path: partPaths[i], offset: starts[i] }));

const seconds = (stamp) =>
  stamp
    .split(":")
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);

function parseVtt(text) {
  return text
    .replace(/\r/g, "")
    .split(/\n\n+/)
    .map((block) => block.trim().split("\n"))
    .filter((lines) => lines[0]?.includes("-->"))
    .map(([timing, ...rest]) => {
      const [start, end] = timing.split("-->").map((t) => seconds(t.trim()));
      return { start, end, text: rest.join(" ") };
    });
}

// The recognition spells the Gryphon as it sounds.
const normalise = (word) =>
  word
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]/g, "")
    .replace(/^griffin$/, "gryphon");

/** A string's words, split on spaces and dashes, with where each starts. */
function words(text) {
  const found = [];
  for (const match of text.matchAll(/[^\s—–-]+/g)) {
    const word = normalise(match[0]);
    if (word) found.push({ word, at: match.index });
  }
  return found;
}

// A sentence ends at . ! or ?, its closing quotes, then a space and a capital
// or an opening quote — unless a name and a speech verb follow: “What are they
// doing?” Alice whispered… is one sentence.
const BOUNDARY = /[.!?][”’)]*\s+(?=[“‘(A-Z])/g;
const SPEECH_TAG =
  /^(Alice|[A-Z]\w+ [A-Z]\w+) (said|cried|whispered|shouted|screamed|yelled|exclaimed|thought|persisted|interrupted|continued|asked|replied)\b/;

function sentencesOf(paragraph) {
  const sentences = [];
  let rest = paragraph;
  for (;;) {
    const boundary = [...rest.matchAll(BOUNDARY)].find(
      (match) => !SPEECH_TAG.test(rest.slice(match.index + match[0].length)),
    );
    if (!boundary) break;
    const cut = boundary.index + boundary[0].length;
    sentences.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut);
  }
  return [...sentences, rest.trim()].filter(Boolean);
}

/**
 * Needleman-Wunsch with unit costs: for each book word, the time of the heard
 * word it matched, or `null`. The book side may run past the excerpt, so the
 * alignment ends where the last row is cheapest.
 */
function align(heard, book) {
  const cost = Array.from(
    { length: heard.length + 1 },
    () => new Int32Array(book.length + 1),
  );
  for (let i = 0; i <= heard.length; i++) cost[i][0] = i;
  for (let j = 0; j <= book.length; j++) cost[0][j] = j;
  const step = (i, j) => (heard[i - 1].word === book[j - 1].word ? 0 : 1);
  for (let i = 1; i <= heard.length; i++) {
    for (let j = 1; j <= book.length; j++) {
      cost[i][j] = Math.min(
        cost[i - 1][j - 1] + step(i, j),
        cost[i - 1][j] + 1,
        cost[i][j - 1] + 1,
      );
    }
  }
  const last = cost[heard.length];
  let end = 0;
  for (let j = 0; j <= book.length; j++) if (last[j] < last[end]) end = j;

  const times = new Array(end).fill(null);
  for (let i = heard.length, j = end; i > 0 && j > 0;) {
    if (cost[i][j] === cost[i - 1][j - 1] + step(i, j)) {
      if (step(i, j) === 0) times[j - 1] = heard[i - 1].time;
      i--;
      j--;
    } else if (cost[i][j] === cost[i - 1][j] + 1) i--;
    else j--;
  }
  return times;
}

/** Fills each run of `null` linearly between its neighbours. */
function interpolate(times, length) {
  for (let j = 0; j < times.length; j++) {
    if (times[j] !== null) continue;
    let k = j;
    while (k < times.length && times[k] === null) k++;
    const before = j > 0 ? times[j - 1] : 0;
    const after = k < times.length ? times[k] : length;
    for (let m = j; m < k; m++) {
      times[m] = before + ((after - before) * (m - j + 1)) / (k - j + 1);
    }
    j = k;
  }
  return times;
}

const escape = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stamp = (t) => {
  const h = String(Math.floor(t / 3600)).padStart(2, "0");
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  return `${h}:${m}:${(t % 60).toFixed(3).padStart(6, "0")}`;
};

const cues = [];
let paragraphs = 0;

for (const part of PARTS) {
  let heardCues = parseVtt(readFileSync(part.path, "utf8"));
  if (part.fix) heardCues = part.fix(heardCues);
  // Faster than anyone reads aloud: a recognition burst, not speech.
  heardCues = heardCues.filter(
    (cue) => cue.text.split(/\s+/).length / (cue.end - cue.start || 0.01) < 6,
  );
  // Within a cue, a word's time is placed by its share of the characters.
  const heard = heardCues.flatMap((cue) =>
    words(cue.text).map(({ word, at }) => ({
      word,
      time: cue.start + ((cue.end - cue.start) * at) / (cue.text.length || 1),
    })),
  );

  // The chapter's paragraphs, after its number and title lines.
  const from = book.indexOf(`\n${part.chapter}\n`);
  const chapter = book.slice(from, book.indexOf(part.next, from + 10));
  const sentences = chapter
    .split("\n")
    .slice(3)
    .join("\n")
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .replace(/\s*\n\s*/g, " ")
        .replace(/_/g, "")
        .trim(),
    )
    .filter(Boolean)
    .flatMap((paragraph, index) =>
      sentencesOf(paragraph).map((text) => ({ text, paragraph: index })),
    );
  const bookWords = sentences.flatMap((sentence, index) =>
    words(sentence.text).map(({ word }) => ({ word, sentence: index })),
  );

  const window = bookWords.slice(0, heard.length + 60);
  const aligned = align(heard, window);
  const matched = aligned.filter((t) => t !== null).length;
  const times = interpolate(aligned, part.length);

  const sentenceStarts = [];
  times.forEach((time, j) => {
    sentenceStarts[window[j].sentence] ??= time;
  });
  const lastSentence = window[times.length - 1].sentence;

  let previousParagraph = -1;
  let previousStart = 0;
  for (let index = 0; index <= lastSentence; index++) {
    const start = Math.max(sentenceStarts[index], previousStart);
    previousStart = start;
    const end = index < lastSentence ? sentenceStarts[index + 1] : part.length;
    const { text, paragraph } = sentences[index];
    cues.push({
      id: paragraph === previousParagraph ? "" : `p${++paragraphs}`,
      start: part.offset + start,
      end: part.offset + Math.max(end, start + 0.2),
      text,
    });
    previousParagraph = paragraph;
  }
  console.error(
    `${part.chapter} ${heard.length} words heard, ${matched} of ${times.length} matched, ${lastSentence + 1} sentences.`,
  );
}

writeFileSync(
  OUT,
  "WEBVTT\n\n" +
    cues
      .map(
        ({ id, start, end, text }) =>
          `${id ? `${id}\n` : ""}${stamp(start)} --> ${stamp(end)}\n${escape(text)}`,
      )
      .join("\n\n") +
    "\n",
);
console.error(`Wrote ${cues.length} cues to ${OUT}.`);
