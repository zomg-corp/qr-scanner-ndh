import { readdirSync } from "node:fs";
import { expect, it } from "vitest";

import { SHARDS } from "./end-to-end";

it("has one end-to-end test file per shard", () => {
  const files = readdirSync(new URL(".", import.meta.url)).filter((n) => /^end-to-end-\d+\.test\.ts$/.test(n));
  expect(files.sort()).toEqual(Array.from({ length: SHARDS }, (_, i) => `end-to-end-${i}.test.ts`));
});
