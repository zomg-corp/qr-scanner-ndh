import { expect, it } from "vitest";

import { outOfTime, startBudget } from "../src/jsqr/src/budget";

it("runs the decoder without its time budget", () => {
  startBudget(-1);
  expect(outOfTime()).toBe(false);
});
