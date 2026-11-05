import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { expect, it } from "vitest";

import { fixture, loadPng } from "./jsqr/helpers";

/** The worker script that the committed qr-scanner-worker.min.js puts in a blob URL. */
async function workerScript(): Promise<string> {
  const bundle = await readFile(new URL("../qr-scanner-worker.min.js", import.meta.url), "utf8");
  let script = "";
  const sandbox = {
    Blob: class {
      constructor(parts: string[]) {
        script = parts.join("");
      }
    },
    URL: { createObjectURL: () => "blob:worker" },
    Worker: class {},
  };
  runInNewContext(`${bundle.replace(/^export const createWorker=/, "const createWorker=")}\ncreateWorker();`, sandbox);
  return script;
}

it("the committed worker bundle decodes a QR code", async () => {
  const posted: unknown[] = [];
  const self: { onmessage?: (event: { data: unknown }) => void; postMessage: (message: unknown) => void } = {
    postMessage: (message) => posted.push(message),
  };
  // a clock that stands still, so the decoder's time budget never runs out
  runInNewContext(await workerScript(), { self, Date: { now: () => 0 } });

  const image = await loadPng(fixture("end-to-end/0/input.png"));
  const expected = JSON.parse(await readFile(fixture("end-to-end/0/output.json"), "utf8"));
  self.onmessage?.({ data: { id: 1, type: "inversionMode", data: "both" } });
  self.onmessage?.({ data: { id: 2, type: "decode", data: { data: image.data, width: image.width, height: image.height } } });

  expect(posted).toEqual([
    {
      id: 2,
      type: "qrResult",
      data: expected.data,
      cornerPoints: [
        expected.location.topLeftCorner,
        expected.location.topRightCorner,
        expected.location.bottomRightCorner,
        expected.location.bottomLeftCorner,
      ],
    },
  ]);
});
