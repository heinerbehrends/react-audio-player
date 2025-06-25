import React from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { AudioPlayer } from "../src/Player/AudioPlayer";

const defaultAudioFiles = [{ src: "test-audio.mp3" }];

interface CustomRenderOptions extends RenderOptions {
  audioFiles?: Array<{ src: string }>;
}

function customRender(
  ui: React.ReactElement,
  options?: CustomRenderOptions,
): RenderResult {
  const { audioFiles = defaultAudioFiles, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AudioPlayer audioFiles={audioFiles}>{children}</AudioPlayer>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export { customRender as render };
