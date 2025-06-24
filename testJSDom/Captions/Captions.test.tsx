import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Captions } from "../../src/Captions/Captions";
import { createCaptionsContext } from "../testUtils";
import { renderWithCaptionsContext } from "../testComponents";

// Mock ToggleCaptions
vi.mock("../../src/Captions/ToggleCaptions", () => ({
  ToggleCaptions: () => <button data-testid="toggle-captions">Toggle</button>,
}));

describe("Captions", () => {
  const captionsContext = createCaptionsContext();
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders caption text when showCaptions is true", () => {
    renderWithCaptionsContext({
      captionsContext,
      component: <Captions.Display />,
    });

    const captionsSection = screen.getByRole("region", { name: /captions/i });
    expect(captionsSection).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("This is a test")).toBeInTheDocument();
  });

  it("does not render captions when showCaptions is false", () => {
    const contextWithoutCaptions = {
      ...captionsContext,
      showCaptions: false,
    };

    renderWithCaptionsContext({
      captionsContext: contextWithoutCaptions,
      component: <Captions.Display />,
    });

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
  });

  it("renders with proper accessibility attributes", () => {
    renderWithCaptionsContext({
      captionsContext,
      component: <Captions.Display />,
    });

    const captionsSection = screen.getByRole("region");
    expect(captionsSection).toHaveAttribute("aria-label", "Captions");
    expect(captionsSection).toHaveAttribute("aria-live", "polite");
    expect(captionsSection).toHaveAttribute("aria-atomic", "false");
    expect(captionsSection).toHaveAttribute("aria-relevant", "additions");
    expect(captionsSection).toHaveAttribute("tabIndex", "0");
  });

  it("passes additional props to the section element", () => {
    renderWithCaptionsContext({
      captionsContext,
      component: (
        <Captions.Display className="custom-class" data-testid="captions" />
      ),
    });

    const captionsSection = screen.getByRole("region");
    expect(captionsSection).toHaveClass("custom-class");
    expect(captionsSection).toHaveAttribute("data-testid", "captions");
  });

  it("renders empty section when there are no cues", () => {
    const contextWithoutCues = {
      ...captionsContext,
      cues: [],
    };

    renderWithCaptionsContext({
      captionsContext: contextWithoutCues,
      component: <Captions.Display />,
    });

    const captionsSection = screen.getByRole("region");
    expect(captionsSection).toBeInTheDocument();
    expect(captionsSection.children.length).toBe(0);
  });

  it("exports Toggle component", () => {
    expect(Captions.Toggle).toBeDefined();

    render(<Captions.Toggle />);
    expect(screen.getByTestId("toggle-captions")).toBeInTheDocument();
  });
});

describe("Captions.Toggle", () => {
  it("renders the ToggleCaptions component", () => {
    render(<Captions.Toggle />);
    expect(screen.getByTestId("toggle-captions")).toBeInTheDocument();
  });
});
