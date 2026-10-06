import type { SliderComponent } from "../AudioElement/sideEffectActions";
import { SLIDER_MODES } from "./sliderModes";
import type { SliderValue } from "./useSlider";

export type SliderRootAttributes = {
  readonly "data-part": "root";
  readonly "data-slider": SliderComponent;
  readonly "data-state": SliderValue["dragState"];
  readonly "data-orientation": SliderValue["orientation"];
};

/**
 * The attributes every slider root carries, read off the slider itself so the
 * three hand-written root `<div>`s cannot drift apart, as they have before.
 *
 * Drag state lives here rather than on the thumb: every part is a descendant, so
 * one attribute reaches all of them (S9). `data-orientation` is here because
 * `aria-orientation` sits on `.Control`, a child, where a root-level layout rule
 * cannot see it. `data-slider` is here because all three share their part
 * names, and a rule for one slider's parts needs something to scope by.
 *
 * No `data-disabled`: `.Control` already renders `aria-disabled`, and
 * `[data-part="root"]:has([aria-disabled="true"])` reaches the root from it.
 */
export function sliderRootAttributes(
  slider: SliderValue,
): SliderRootAttributes {
  return {
    "data-part": "root",
    "data-slider": SLIDER_MODES[slider.mode].component,
    "data-state": slider.dragState,
    "data-orientation": slider.orientation,
  };
}
