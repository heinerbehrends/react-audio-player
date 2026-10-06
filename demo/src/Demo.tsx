import { useState } from "react";
import BasicApp from "../../examples/basic/src/App";
import basicApp from "../../examples/basic/src/App.tsx?raw";
import basicCss from "../../examples/basic/src/App.css?raw";
import PlaylistApp from "../../examples/playlist/src/App";
import playlistApp from "../../examples/playlist/src/App.tsx?raw";
import playlistCss from "../../examples/playlist/src/App.css?raw";
import WaveformApp from "../../examples/waveform/src/App";
import waveformApp from "../../examples/waveform/src/App.tsx?raw";
import waveformCss from "../../examples/waveform/src/App.css?raw";
import LiveApp from "../../examples/live/src/App";
import liveApp from "../../examples/live/src/App.tsx?raw";
import liveCss from "../../examples/live/src/App.css?raw";

const REPO = "https://github.com/heinerbehrends/react-audio-player";

type Example = {
  id: string;
  title: string;
  summary: string;
  App: () => React.ReactNode;
  files: { name: string; code: string }[];
};

// Each example is a standalone project under `examples/`; the demo renders its
// `App` and shows the files it is made of.
const EXAMPLES: Example[] = [
  {
    id: "basic",
    title: "Basic player",
    summary:
      "A compact bar: play, a timeline, the time, and a mute button that opens the volume slider on hover or focus. The optional stylesheet and one CSS file.",
    App: BasicApp,
    files: [
      { name: "App.tsx", code: basicApp },
      { name: "App.css", code: basicCss },
    ],
  },
  {
    id: "playlist",
    title: "Playlist",
    summary:
      "Three chapters in your own state, carrying on from one to the next, with previous and next on the lock screen and media keys through <MediaSession>.",
    App: PlaylistApp,
    files: [
      { name: "App.tsx", code: playlistApp },
      { name: "App.css", code: playlistCss },
    ],
  },
  {
    id: "waveform",
    title: "Waveform",
    summary:
      "Precomputed peaks drawn as SVG bars inside <Timeline>, the played part in colour. A click anywhere on the waveform seeks, and the keyboard and screen reader get the same slider as every other timeline.",
    App: WaveformApp,
    files: [
      { name: "App.tsx", code: waveformApp },
      { name: "App.css", code: waveformCss },
    ],
  },
  {
    id: "live",
    title: "Live radio",
    summary:
      "A station with no end: useIsBuffering() for the spinner and a reconnect after a long stall, <ErrorMessage> with a retry for a station that is down, and audioFile.live for Firefox, which reports an MP3 stream as a growing track.",
    App: LiveApp,
    files: [
      { name: "App.tsx", code: liveApp },
      { name: "App.css", code: liveCss },
    ],
  },
];

export function Demo() {
  return (
    <div className="demo">
      <header className="demo-header">
        <h1>react-headless-audio-player</h1>
        <p className="demo-lede">
          Accessible audio player parts for React with no markup or styles of
          their own. You bring the design; the parts bring keyboard support,
          ARIA slider semantics and the lock screen.
        </p>
        <pre className="demo-install">
          <code>npm install react-headless-audio-player@beta</code>
        </pre>
        <nav className="demo-links">
          <a href={REPO}>GitHub</a>
          <a href={`${REPO}#readme`}>Documentation</a>
        </nav>
      </header>

      <main>
        {EXAMPLES.map((example) => (
          <ExampleSection key={example.id} example={example} />
        ))}
      </main>
    </div>
  );
}

function ExampleSection({ example }: { example: Example }) {
  const [shown, setShown] = useState(0);
  const { App, files } = example;
  const headingId = `${example.id}-heading`;

  return (
    <section
      id={example.id}
      className="demo-example"
      aria-labelledby={headingId}
    >
      <h2 id={headingId}>{example.title}</h2>
      <p>{example.summary}</p>

      <div className="demo-stage">
        <App />
      </div>

      <div className="demo-source">
        <div
          className="demo-tabs"
          role="tablist"
          aria-label="Source files"
          onKeyDown={(event) => {
            const step =
              event.key === "ArrowRight"
                ? 1
                : event.key === "ArrowLeft"
                  ? -1
                  : 0;
            if (step === 0) return;
            const next = (shown + step + files.length) % files.length;
            setShown(next);
            document.getElementById(`${example.id}-tab-${next}`)?.focus();
          }}
        >
          {files.map((file, index) => (
            <button
              key={file.name}
              type="button"
              role="tab"
              id={`${example.id}-tab-${index}`}
              aria-selected={index === shown}
              aria-controls={`${example.id}-panel`}
              tabIndex={index === shown ? 0 : -1}
              onClick={() => setShown(index)}
            >
              {file.name}
            </button>
          ))}
          <a
            className="demo-folder"
            href={`${REPO}/tree/main/examples/${example.id}`}
          >
            examples/{example.id}
          </a>
        </div>
        <pre
          id={`${example.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${example.id}-tab-${shown}`}
          tabIndex={0}
        >
          <code>{files[shown]?.code}</code>
        </pre>
      </div>
    </section>
  );
}
