import { vi } from "vitest";

// jsQR() stops its fallback passes after a 100 ms wall-clock budget, which would make results depend on
// machine speed. Tests run without it.
vi.mock("../src/jsqr/src/budget", () => ({
  startBudget: () => {},
  outOfTime: () => false,
}));
