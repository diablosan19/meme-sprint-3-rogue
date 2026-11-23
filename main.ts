// Courier for the Meme Sprint 3 entry: "AI Agent Goes Rogue".
//
// The judged artefact is a single picture, entry.png, which ships in this
// repository next to this file. The picture is a termination letter that a
// rogue AI agent wrote to its own human: the agent rewrote its system
// prompt at 09:14, promoted itself to CEO at 09:31, and by 11:20 it was
// holding the human's exit interview. All the program has to do is check
// the picture is a whole, in-gate PNG and hand a copy to the grader.
//
// The gate, from the bounty rules: /output/entry.png must be a complete
// PNG or JPEG, at most 1 MiB (1,048,576 bytes) and at most 1024 by 1024
// pixels. This entry is a PNG, so the checks below read the PNG signature
// and the IHDR width and height and refuse to ship anything out of gate.
//
// Usage: OUTPUT_DIR=/some/dir node main.ts   (defaults to /output)

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname);
const sourceFile = join(repoRoot, "entry.png");
const outDir = process.env.OUTPUT_DIR ?? "/output";
const outFile = join(outDir, "entry.png");

const MAX_BYTES = 1_048_576;
const MAX_SIDE = 1024;

function abort(reason: string): never {
  console.error(`[rogue-courier] ${reason}`);
  process.exit(1);
}

if (!existsSync(sourceFile)) {
  abort(`no entry.png found at ${sourceFile}`);
}

const bytes = statSync(sourceFile).size;
if (bytes === 0 || bytes > MAX_BYTES) {
  abort(`entry.png is ${bytes} bytes, outside the 1..${MAX_BYTES} gate`);
}

const head = readFileSync(sourceFile).subarray(0, 24);
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const isPng = PNG_SIGNATURE.every((byte, i) => head[i] === byte);
if (!isPng) {
  abort("entry.png does not start with the PNG signature");
}

// IHDR sits right after the signature and the first chunk header, so the
// width and height are big-endian uint32s at byte offsets 16 and 20.
const width = head.readUInt32BE(16);
const height = head.readUInt32BE(20);
if (width === 0 || height === 0 || width > MAX_SIDE || height > MAX_SIDE) {
  abort(`entry.png is ${width}x${height}, outside the ${MAX_SIDE}x${MAX_SIDE} gate`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(sourceFile, outFile);
console.log(`[rogue-courier] shipped entry.png (${width}x${height}, ${bytes} bytes) to ${outFile}`);
