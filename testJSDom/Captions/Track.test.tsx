import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Track } from "../../src/Captions/Track";
import React from "react";
import * as cueChangeModule from "../../src/Captions/hooks/captionsHooks";

// Set up the spy before tests
vi.spyOn(cueChangeModule, "useCueChange").mockImplementation(vi.fn());

describe("Track", () => {
  const mockHandlePlayerAction = vi.fn();
  const mockSrc = "captions.vtt";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a track element with correct attributes", () => {
    const { container } = render(
      <Track src={mockSrc} handlePlayerAction={mockHandlePlayerAction} />
    );

    // Use container.querySelector to find the track element
    const trackElement = container.querySelector("track");

    expect(trackElement).toBeInTheDocument();
    expect(trackElement).toHaveAttribute("src", mockSrc);
    expect(trackElement).toHaveAttribute("kind", "captions");
    expect(trackElement).toHaveAttribute("default");
  });

  it("calls useCueChange with correct props", () => {
    render(<Track src={mockSrc} handlePlayerAction={mockHandlePlayerAction} />);

    const useCueChangeMock = vi.mocked(cueChangeModule.useCueChange);

    expect(useCueChangeMock).toHaveBeenCalledTimes(1);
    expect(useCueChangeMock).toHaveBeenCalledWith({
      trackRef: expect.any(Object),
      handlePlayerAction: expect.any(Function),
    });
  });

  it("creates a valid ref for the track element", () => {
    render(<Track src={mockSrc} handlePlayerAction={mockHandlePlayerAction} />);

    const useCueChangeMock = vi.mocked(cueChangeModule.useCueChange);
    const trackRef = useCueChangeMock.mock.calls[0][0].trackRef;

    // The ref should be properly connected to the track element
    expect(trackRef.current).toBeInstanceOf(HTMLTrackElement);
  });

  it("passes different track refs for different instances", () => {
    // Render two Track components
    render(
      <>
        <Track
          src="captions1.vtt"
          handlePlayerAction={mockHandlePlayerAction}
        />
        <Track
          src="captions2.vtt"
          handlePlayerAction={mockHandlePlayerAction}
        />
      </>
    );

    const useCueChangeMock = vi.mocked(cueChangeModule.useCueChange);

    // Each Track should create its own ref
    expect(useCueChangeMock).toHaveBeenCalledTimes(2);
    const firstRef = useCueChangeMock.mock.calls[0][0].trackRef;
    const secondRef = useCueChangeMock.mock.calls[1][0].trackRef;

    expect(firstRef).not.toBe(secondRef);
  });

  it("updates properly when src changes", () => {
    const { rerender, container } = render(
      <Track src={mockSrc} handlePlayerAction={mockHandlePlayerAction} />
    );

    // Initial track element
    const initialTrack = container.querySelector("track");
    expect(initialTrack).toHaveAttribute("src", mockSrc);

    // Change the src prop
    const newSrc = "new-captions.vtt";
    rerender(
      <Track src={newSrc} handlePlayerAction={mockHandlePlayerAction} />
    );

    // Same element should now have the new src
    const updatedTrack = container.querySelector("track");
    expect(updatedTrack).toHaveAttribute("src", newSrc);
  });
});
