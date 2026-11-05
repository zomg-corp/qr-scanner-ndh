// parkpass: a per-call wall-clock budget shared by the scan cascade (index.ts)
// and the locator. The fork's exhaustive fallback is great for decode rate but
// unbounded on frames with no decodable QR — on pure clutter a single locate()
// over a 480×480 frame, run twice per binarization, dominates and can take well
// over a second. A live camera loop (qr-scanner calls jsQR per sampled frame in
// a worker) needs a hard bound, so jsQR() arms this clock and the hot loops in
// both modules check it and bail. Module-level state is fine: jsQR runs to
// completion synchronously, so calls never interleave.
let deadline = Infinity;

/** Arm the clock for the current jsQR() call. */
export function startBudget(ms: number): void {
  deadline = Date.now() + ms;
}

/** True once the current call has spent its budget. Cheap enough to poll in loops. */
export function outOfTime(): boolean {
  return Date.now() > deadline;
}
