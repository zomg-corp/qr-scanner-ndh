import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    // Without its time budget the decoder runs its whole fallback cascade on hard images: up to ~40 s for one.
    testTimeout: 120_000,
  },
});
