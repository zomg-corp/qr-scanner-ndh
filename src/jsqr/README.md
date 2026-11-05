# jsQR (modernize fork) — with a per-call time budget

This is the TypeScript **source** of jsQR, the decoder that `src/worker.ts`
imports. It replaces the old `jsqr-es6` npm dependency. The endticket admin
compiles it from source along with the rest of `src/`.

## Provenance

- Upstream: <https://github.com/cozmo/jsQR> (Apache-2.0, see `LICENSE`).
- Source: branch `claude/modernize-typescript-exports-jfq5r`,
  commit `bc28490b91f031c66f0441902bb08f524e061d7c`.
- The production `src/*.ts` files are here. jsQR's tests and image corpus are in
  `test/jsqr/` at the repository root, run by vitest with the time budget
  switched off. This fork modernizes the build/exports **and** adds real decoder
  improvements over jsQR 1.4.0 (which `jsqr-es6` was pinned to): Otsu + multi
  region-size binarization, Reed–Solomon false-success rejection, three-vote
  module sampling, and dimension/translation/per-corner location perturbation
  retries — a net decode-rate win for angled/low-light/blurry camera frames.

This is a copy, not a dependency, because it pins an *unmerged feature branch*
of a third-party repo: a copy is self-contained and can't break if that branch
is rebased or deleted upstream.

## Local modifications (per Apache-2.0 §4)

A **per-call wall-clock budget** was added so the fork's exhaustive fallback
cascade can't stall the live camera loop. Without it, a frame containing **no
decodable QR** (e.g. the camera pointed at clutter) runs the entire cascade —
including a fresh, expensive `locate()` per binarization pass — and can take well
over a second per frame; benchmarked at ~1300 ms on a 480×480 noise frame.

- `src/budget.ts` (new): a shared deadline armed once per `jsQR()` call.
- `src/index.ts`: `jsQR()` arms the budget (`SCAN_TIME_BUDGET_MS = 100`); the
  scan passes bail once it's spent.
- `src/locator/index.ts`: the O(W·H) finder scan and the per-group recenter loop
  poll the budget and stop early.

Net effect: the same ~1300 ms noise frame now returns in ~120 ms (budget + at
most one in-flight pass), while a present QR still decodes in ~14 ms. Grep for
`parkpass:` to find every budget change.

The source also compiles under TypeScript `strict`. Functions that can fail
return `T | null`, and nullable values are checked before use, with the same
results as before:

- `src/binarizer/index.ts`: the inverted matrix is `BitMatrix | null`.
- `src/decoder/version.ts`: `infoBits` is `number | null` (versions 1–6).
- `src/decoder/decoder.ts`, `src/decoder/decodeData/index.ts`,
  `src/decoder/reedsolomon/index.ts`, `src/locator/index.ts`: `| null` return
  types; `readVersion` treats a null `infoBits` as 0, as `x ^ null` did; data
  blocks stop on a missing codeword, which the codeword count rules out.
- `src/locator/index.ts`: the run-length merge reads the first elements by
  index instead of `shift()`.
