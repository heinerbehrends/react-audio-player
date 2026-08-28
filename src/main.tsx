import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// The library's optional defaults. A consumer writes
// `import "react-headless-audio-player/styles.css"`.
import "./styles.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
