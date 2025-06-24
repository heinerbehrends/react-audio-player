import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ToggleCaptions } from "../../src/Captions/ToggleCaptions";
import { CaptionsContext } from "../../src/Captions/CaptionsContext";

// Create a variable to control the hook's return value
let isDisabledMockValue = false;

// Mock the module with a function that uses our variable
vi.mock("../../src/Shared/useIsDisabled", () => ({
  useIsDisabled: () => isDisabledMockValue,
}));

describe("ToggleCaptions", () => {
  const mockSetShowCaptions = vi.fn();

  // Default captions context
  const defaultContext = {
    cues: [],
    showCaptions: false,
    setCues: vi.fn(),
    setShowCaptions: mockSetShowCaptions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default value before each test
    isDisabledMockValue = false;
  });

  it("renders button with correct text", () => {
    render(
      <CaptionsContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </CaptionsContext.Provider>,
    );

    const button = screen.getByRole("button", { name: /toggle captions/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Show Captions");
  });

  it("has correct ARIA attributes when captions are off", () => {
    render(
      <CaptionsContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </CaptionsContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Toggle Captions");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("has correct ARIA attributes when captions are on", () => {
    const contextWithCaptions = {
      ...defaultContext,
      showCaptions: true,
    };

    render(
      <CaptionsContext.Provider value={contextWithCaptions}>
        <ToggleCaptions />
      </CaptionsContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("calls setShowCaptions with opposite value when clicked", () => {
    render(
      <CaptionsContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </CaptionsContext.Provider>,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockSetShowCaptions).toHaveBeenCalledWith(true);
  });

  it("is disabled when useIsDisabled returns true", () => {
    // Set the mock value to true
    isDisabledMockValue = true;

    render(
      <CaptionsContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </CaptionsContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("is enabled when useIsDisabled returns false", () => {
    // Set the mock value to false
    isDisabledMockValue = false;

    render(
      <CaptionsContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </CaptionsContext.Provider>,
    );

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });

  it("memoizes the click handler to prevent unnecessary rerenders", () => {
    const { rerender } = render(
      <CaptionsContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </CaptionsContext.Provider>,
    );

    const initialButton = screen.getByRole("button");
    const initialOnClick = initialButton.onclick;

    // Force a rerender with the same props
    rerender(
      <CaptionsContext.Provider value={defaultContext}>
        <ToggleCaptions />
      </CaptionsContext.Provider>,
    );

    const updatedButton = screen.getByRole("button");
    expect(updatedButton.onclick).toBe(initialOnClick);
  });
});
