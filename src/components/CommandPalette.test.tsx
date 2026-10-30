// @vitest-environment jsdom
import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("CommandPalette", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("is hidden by default and opens on custom open-command-palette event", () => {
    render(<CommandPalette />);
    expect(
      screen.queryByPlaceholderText(/Search programmes/i),
    ).not.toBeInTheDocument();

    // Trigger open event
    fireEvent(window, new CustomEvent("open-command-palette"));

    expect(
      screen.getByPlaceholderText(/Search programmes/i),
    ).toBeInTheDocument();
  });

  it("opens on Cmd+K keyboard shortcut and closes on Escape", () => {
    render(<CommandPalette />);

    // Press Cmd+K
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(
      screen.getByPlaceholderText(/Search programmes/i),
    ).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByPlaceholderText(/Search programmes/i),
    ).not.toBeInTheDocument();
  });

  it("filters items by query and navigates on Enter", () => {
    render(<CommandPalette />);

    fireEvent(window, new CustomEvent("open-command-palette"));
    const input = screen.getByPlaceholderText(/Search programmes/i);

    // Type "linux"
    fireEvent.change(input, { target: { value: "linux" } });
    expect(screen.getByText(/Linux Fundamentals/i)).toBeInTheDocument();

    // Press Enter to select
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/learn/linux-fundamentals");
  });
});
