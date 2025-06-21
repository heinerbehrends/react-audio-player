import React, { useContext } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, render } from "@testing-library/react";
import { PlayerContextProvider } from "../../src/Player/PlayerProvider";
import {
  PlayerContext,
  PlayerContextType,
} from "../../src/Player/PlayerContext";
import { AudioContext } from "../../src/AudioElement/AudioContext";
import { createAudioElement, createAudioContext } from "../testUtils";
import { renderWithAudioContext } from "../testComponents";
import type { SideEffectAction } from "../../src/AudioElement/sideEffectActions";

const mockHandleSideEffect = vi.fn();
vi.mock("../../src/AudioElement/useHandleSideEffect", () => ({
  useHandleSideEffect: () => {
    const { audioElementRef } = useContext(AudioContext);
    return (action: SideEffectAction) =>
      mockHandleSideEffect(action, audioElementRef.current);
  },
}));

describe("PlayerContextProvider", () => {
  const mockAudioElement = createAudioElement({
    currentTime: 50,
    volume: 0.5,
  }) as HTMLAudioElement;

  const mockAudioContext = createAudioContext({
    audioElementRef: { current: mockAudioElement },
  });
  // Create a test component to access context values
  const TestConsumer = ({
    testId = "test-value",
    onMount,
  }: {
    testId?: string;
    onMount?: (context: PlayerContextType) => void;
  }) => {
    const contextValue = useContext(PlayerContext);

    // Call onMount with context if provided
    React.useEffect(() => {
      if (onMount) {
        onMount(contextValue);
      }
    }, [onMount, contextValue]);

    return (
      <div>
        <button onClick={() => mockHandleSideEffect({ type: "TOGGLE_PLAY" })}>
          Toggle Play
        </button>
        <button
          onClick={() =>
            mockHandleSideEffect({
              type: "UNMUTE",
            })
          }
        >
          Set Unmute Volume
        </button>
        <div data-testid={`${testId}-player-state`}>
          {contextValue.playerState}
        </div>
        <div data-testid={`${testId}-volume-state`}>
          {contextValue.volumeState}
        </div>
        <div data-testid={`${testId}-playback-rate`}>
          {contextValue.playbackRate}
        </div>
      </div>
    );
  };

  const renderWithProvider = (audioFiles = [{ src: "test.mp3" }]) => {
    return renderWithAudioContext({
      audioContext: mockAudioContext,
      component: (
        <PlayerContextProvider audioFiles={audioFiles}>
          <TestConsumer />
        </PlayerContextProvider>
      ),
    });
  };

  describe("getPlayerState", () => {
    it("returns correct state from audio element", () => {
      let contextValue: PlayerContextType | undefined;
      renderWithAudioContext({
        audioContext: mockAudioContext,
        component: (
          <PlayerContextProvider audioFiles={[{ src: "test.mp3" }]}>
            <TestConsumer
              onMount={(context) => {
                contextValue = context;
              }}
            />
          </PlayerContextProvider>
        ),
      });

      expect(contextValue).toBeDefined();
      const state = contextValue!.getPlayerState();
      expect(state).toEqual({
        duration: 100,
        currentTime: 50,
        volume: 0.5,
        playbackRate: 1,
        volumeState: "high",
      });
    });

    it("handles null audio element gracefully", () => {
      const nullAudioContext = {
        ...mockAudioContext,
        audioElementRef: { current: null },
      };

      let contextValue: PlayerContextType | undefined;
      renderWithAudioContext({
        audioContext: nullAudioContext,
        component: (
          <PlayerContextProvider audioFiles={[{ src: "test.mp3" }]}>
            <TestConsumer
              onMount={(context) => {
                contextValue = context;
              }}
            />
          </PlayerContextProvider>
        ),
      });

      expect(contextValue).toBeDefined();
      const state = contextValue!.getPlayerState();
      expect(state).toEqual({
        duration: 0,
        currentTime: 0,
        volume: 1,
        playbackRate: 1,
        volumeState: "high",
      });
    });
  });

  describe("handlePlayerAction", () => {
    it("handles side effect actions", () => {
      renderWithProvider();
      fireEvent.click(screen.getByText("Toggle Play"));
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "TOGGLE_PLAY",
      });
    });
  });

  describe("Memoization", () => {
    it("memoizes context value", () => {
      const renderSpy = vi.fn();

      function ContextTracker() {
        const context = useContext(PlayerContext);
        renderSpy(context);
        return null;
      }

      const { rerender } = render(
        <AudioContext.Provider value={mockAudioContext}>
          <PlayerContextProvider audioFiles={[{ src: "test.mp3" }]}>
            <ContextTracker />
          </PlayerContextProvider>
        </AudioContext.Provider>,
      );

      const firstContext = renderSpy.mock.calls[0]![0];

      rerender(
        <AudioContext.Provider value={mockAudioContext}>
          <PlayerContextProvider audioFiles={[{ src: "test.mp3" }]}>
            <ContextTracker />
          </PlayerContextProvider>
        </AudioContext.Provider>,
      );

      const secondContext = renderSpy.mock.calls[1]![0];
      expect(secondContext).toBe(firstContext);
    });
  });

  describe("Error Handling", () => {
    it("handles missing audio files gracefully", () => {
      renderWithProvider([]);
      expect(screen.getByTestId("test-value-player-state")).toHaveTextContent(
        "loading",
      );
    });

    it("handles invalid audio file format gracefully", () => {
      renderWithProvider([{ src: "" }]);
      expect(screen.getByTestId("test-value-player-state")).toHaveTextContent(
        "loading",
      );
    });
  });
});
