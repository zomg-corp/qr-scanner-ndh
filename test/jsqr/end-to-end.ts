import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, it } from "vitest";
import * as assert from "node:assert/strict";

import jsQR from "../../src/jsqr/src/index";
import { fixture, loadPng } from "./helpers";

/** The number of end-to-end-<n>.test.ts files; vitest runs files in parallel, the tests in a file one by one. */
export const SHARDS = 4;

/**
 * Without its time budget (switched off in test/setup.ts) the decoder runs its whole fallback cascade on hard
 * images: up to ~40 s for one locally, about 2.5× that on a GitHub runner. The job's 15-minute cap bounds a hang.
 */
const CORPUS_TEST_TIMEOUT_MS = 300_000;

/** Defines the end-to-end tests for every SHARDS-th image of the corpus, starting at `shard`. */
export function describeEndToEnd(shard: number): void {
  describe("end to end", () => {
    const tests = readdirSync(fixture("end-to-end"))
      .sort()
      .filter((n) => !n.includes("."))
      .filter((_, i) => i % SHARDS === shard);
    for (const t of tests) {
      it(t, async () => {
        const inputImage = await loadPng(fixture(`end-to-end/${t}/input.png`));
        const expectedOutput = JSON.parse(await readFile(fixture(`end-to-end/${t}/output.json`), "utf8"));
        assert.deepEqual(jsQR(inputImage.data, inputImage.width, inputImage.height), expectedOutput);
      }, CORPUS_TEST_TIMEOUT_MS);
    }
  });
}
