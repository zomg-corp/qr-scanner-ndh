# Vendored jsQR (modernize fork) — with a per-call time budget

This is the TypeScript **source** of jsQR, vendored into the repo and compiled
from source by Vite (the `qr-scanner` worker imports it; see
`frontend/admin/vite.config.mts`). It replaces the old `jsqr-es6` npm dependency.

## Provenance

- Upstream: <https://github.com/cozmo/jsQR> (Apache-2.0, see `LICENSE`).
- Source: branch `claude/modernize-typescript-exports-jfq5r`,
  commit `bc28490b91f031c66f0441902bb08f524e061d7c`.
- Only the production `src/*.ts` files are vendored (tests and test fixtures are
  omitted). This fork modernizes the build/exports **and** adds real decoder
  improvements over jsQR 1.4.0 (which `jsqr-es6` was pinned to): Otsu + multi
  region-size binarization, Reed–Solomon false-success rejection, three-vote
  module sampling, and dimension/translation/per-corner location perturbation
  retries — a net decode-rate win for angled/low-light/blurry camera frames.

We vendor a copy (rather than a git submodule) because we pin an *unmerged
feature branch* of a third-party repo: a copy is self-contained and can't break
if that branch is rebased or deleted upstream.

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
`parkpass:` to find every change.
