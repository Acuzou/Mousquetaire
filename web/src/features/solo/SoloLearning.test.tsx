import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SoloLearning } from "./SoloLearning";

describe("SoloLearning", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  function completeNominalPath(onExit: () => void) {
    render(<SoloLearning onExit={onExit} />);

    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuer vers l'atelier grille/i }));

    fireEvent.click(screen.getByTestId("solo-word-card-0"));
    fireEvent.click(screen.getByTestId("solo-reveal-selection-button"));

    expect(screen.getAllByText(/carte\(s\) revelee\(s\)\./).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole("button", { name: /Terminer le parcours nominal/i }));
  }

  it("progresses through steps and reveals selection like multi ritual", () => {
    const onExit = vi.fn();
    completeNominalPath(onExit as () => void);

    expect(screen.getByTestId("solo-completion-panel")).toBeInTheDocument();
    expect(screen.getByText(/Felicitations/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("solo-completion-return-multi"));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("shows resume panel when partial progress exists in sessionStorage", () => {
    sessionStorage.setItem(
      "mousquetaire_solo_v1",
      JSON.stringify({ step: 2, completedNominal: false }),
    );

    render(<SoloLearning onExit={vi.fn()} />);

    expect(screen.getByTestId("solo-resume-panel")).toBeInTheDocument();
    expect(screen.getByTestId("solo-resume-button")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("solo-resume-button"));

    expect(screen.getByTestId("solo-reveal-selection-button")).toBeInTheDocument();
    expect(screen.queryByTestId("solo-resume-panel")).not.toBeInTheDocument();
  });

  it("restarts from beginning when requested from resume panel", () => {
    sessionStorage.setItem(
      "mousquetaire_solo_v1",
      JSON.stringify({ step: 1, completedNominal: false }),
    );

    render(<SoloLearning onExit={vi.fn()} />);

    fireEvent.click(screen.getByTestId("solo-restart-from-resume-button"));

    expect(screen.getByRole("button", { name: "Continuer" })).toBeInTheDocument();
    expect(screen.queryByTestId("solo-resume-panel")).not.toBeInTheDocument();
  });

  it("restarts after completion via Recommencer", () => {
    const onExit = vi.fn();
    completeNominalPath(onExit as () => void);

    fireEvent.click(screen.getByTestId("solo-completion-restart"));

    expect(screen.getByRole("button", { name: "Continuer" })).toBeInTheDocument();
    expect(screen.queryByTestId("solo-completion-panel")).not.toBeInTheDocument();
  });
});
