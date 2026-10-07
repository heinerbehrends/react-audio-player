import { formatTime, type PlayerLabels } from "react-headless-audio-player";

// Every string the library renders or announces, in German. Each entry is
// optional and one left out keeps its English default, so a partial object
// would do; this one covers all of them. The string entries are plain data and
// could come straight from a `de.json`; the function entries receive raw
// numbers, so `Intl` writes the decimal comma and the percent sign the way
// German does.

const number = new Intl.NumberFormat("de-DE");
const percent = new Intl.NumberFormat("de-DE", { style: "percent" });

/** "1,5×", for the rate buttons, the rate readout and their names alike. */
export const formatRate = (rate: number) => `${number.format(rate)}×`;

/** "80 %", with the non-breaking space German puts before the sign. */
export const formatPercent = (fraction: number) => percent.format(fraction);

export const german: PlayerLabels = {
  player: "Audioplayer",

  // One name per state. The state says what is; the name says what pressing
  // does, so the `muted` entry is the "unmute" text.
  play: {
    playing: "Audio pausieren",
    paused: "Audio abspielen",
    loading: "Audio wird geladen",
    error: "Fehler beim Laden des Audios",
  },
  mute: {
    muted: "Ton einschalten",
    low: "Stummschalten",
    high: "Stummschalten",
  },

  // `time` is the readout's text as shown. It leads, so a voice-control user
  // can say what they see.
  timeToggle: ({ time, shown }) =>
    shown === "elapsed"
      ? `${time} vergangen, Restzeit anzeigen`
      : `${time} verbleibend, vergangene Zeit anzeigen`,

  seek: ({ amount }) =>
    `${Math.abs(amount)} Sekunden ${amount > 0 ? "vor" : "zurück"}`,
  rateSet: ({ rate }) => `Geschwindigkeit ${formatRate(rate)} einstellen`,
  rateChange: ({ amount }) =>
    `Geschwindigkeit um ${formatRate(Math.abs(amount))} ${
      amount > 0 ? "erhöhen" : "verringern"
    }`,
  rateGroup: "Wiedergabegeschwindigkeit",

  timelineSlider: "Position",
  volumeSlider: "Lautstärke",
  rateSlider: "Wiedergabegeschwindigkeit",
  // The sliders' `aria-valuetext`. The timeline's two clocks come from raw
  // seconds; `time` below does not reach here.
  timelineValue: ({ value, maxValue }) =>
    `${formatTime(value)} von ${formatTime(maxValue)}`,
  volumeValue: ({ value, muted }) =>
    muted ? `Stumm, ${formatPercent(value)}` : formatPercent(value),
  rateValue: ({ value }) => formatRate(value),

  // `seconds` is never negative: the library owns which number, this entry
  // owns how it reads, the sign for the time left included.
  time: ({ seconds, part }) =>
    part === "remaining" && seconds > 0
      ? `-${formatTime(seconds)}`
      : formatTime(seconds),
  rateDisplay: ({ rate }) => formatRate(rate),
};
