import type { SliderValue } from "./useSlider";

export type SliderRootAttributes = {
  readonly "data-part": "root";
  readonly "data-state": SliderValue["dragState"];
  readonly "data-orientation": SliderValue["orientation"];
};

/**
 * The attributes every slider root carries, read off the slider itself so they
 * cannot drift from it or from each other — `Timeline`, `Volume` and
 * `PlaybackRateSlider` each hand-write their root `<div>`, and have disagreed
 * about it before.
 *
 * Drag state lives here rather than on the thumb: it is a property of the
 * slider, and all four parts are descendants, so
 * `[data-part="root"][data-state="dragging"] [data-part="thumb"]` reaches them
 * (S9). `data-orientation` is here for the reason that makes it non-redundant —
 * `aria-orientation` sits on `.Control`, a child, where a root-level layout rule
 * cannot see it.
 *
 * There is no `data-disabled`: `.Control` already renders `aria-disabled`, and
 * `[data-part="root"]:has([aria-disabled="true"])` reaches the root from it.
 */
export function sliderRootAttributes(
  slider: SliderValue,
): SliderRootAttributes {
  return {
    "data-part": "root",
    "data-state": slider.dragState,
    "data-orientation": slider.orientation,
  };
}
