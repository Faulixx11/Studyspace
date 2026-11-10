/* StudySpace – kostenlose deutsche Handschrifterkennung
   DE·HTR v2 (Apache-2.0), lokal im Browser via ONNX Runtime Web.
   Das Modell verarbeitet einzelne Zeilen; diese Datei segmentiert die Seite.
*/
(() => {
  "use strict";

  const MODEL_URL = "https://huggingface.co/naeyn/de-htr-web-v2/resolve/main/model.onnx";
  const WASM_URL = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/";
  const IMAGE_HEIGHT = 64;
  const MAX_WIDTH = 1024;
  const STRIDE = 4;
  const ALPHABET = Array.from(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZäöüÄÖÜß0123456789 .,;:!?\"'()[]{}<>-–—_/\\@#%&*+=|€§°²³→←↑↓×÷"
  );

  let ortPromise = null;
  let sessionPromise = null;

  function report(callback, message) {
    if (typeof callback === "function") callback(message);
  }

  async function loadRuntime() {
    if (!ortPromise) {
      ortPromise = import("https://esm.sh/onnxruntime-web@1.27.0").then((ort) => {
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.proxy = false;
        ort.env.wasm.simd = true;
        ort.env.wasm.wasmPaths = WASM_URL;
        return ort;
      });
    }
    return ortPromise;
  }

  async function loadSession() {
    if (!sessionPromise) {
      sessionPromise = (async () => {
        const ort = await loadRuntime();
        return ort.InferenceSession.create(MODEL_URL, {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all"
        });
      })().catch((error) => {
        sessionPromise = null;
        throw error;
      });
    }
    return sessionPromise;
  }

  async function makePageCanvas(blob) {
    const bitmap = await createImageBitmap(blob);
    try {
      const scale = Math.min(1, 2200 / bitmap.width, 3000 / bitmap.height);
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
      if (!context) throw new Error("Bildverarbeitung wird von diesem Browser nicht unterstützt.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);
      return canvas;
    } finally {
      bitmap.close();
    }
  }

  function isInk(r, g, b) {
    const light = 0.299 * r + 0.587 * g + 0.114 * b;
    const blueInk = b > r + 24 && light < 226;
    return light < 215 || blueInk;
  }

  function findLines(canvas) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    const pixels = context.getImageData(0, 0, width, height).data;
    const rowCounts = new Uint32Array(height);
    const leftEdge = Math.floor(width * 0.015);
    const rightEdge = Math.ceil(width * 0.985);

    for (let y = 0; y < height; y++) {
      let count = 0;
      const rowOffset = y * width * 4;
      for (let x = leftEdge; x < rightEdge; x += 1) {
        const p = rowOffset + x * 4;
        if (isInk(pixels[p], pixels[p + 1], pixels[p + 2])) count += 1;
      }
      // Lange, fast durchgehende Zeilen sind meist die gedruckten Hefter-Linien.
      if (count < (rightEdge - leftEdge) * 0.72) rowCounts[y] = count;
    }

    const threshold = Math.max(2, Math.floor(width * 0.0014));
    const active = new Uint8Array(height);
    for (let y = 0; y < height; y++) {
      if (rowCounts[y] >= threshold) active[y] = 1;
    }

    const regions = [];
    let start = -1;
    let lastActive = -1;
    const allowedGap = Math.max(5, Math.round(height * 0.0025));

    for (let y = 0; y < height; y++) {
      if (active[y]) {
        if (start < 0) start = y;
        if (lastActive >= 0 && y - lastActive > allowedGap + 1) {
          if (lastActive - start >= 4) regions.push([start, lastActive]);
          start = y;
        }
        lastActive = y;
      }
    }
    if (start >= 0 && lastActive - start >= 4) regions.push([start, lastActive]);

    const lines = [];
    for (const region of regions) {
      const top = Math.max(0, region[0] - 4);
      const bottom = Math.min(height, region[1] + 5);
      const bandHeight = bottom - top;
      if (bandHeight < 7 || bandHeight > Math.max(150, height * 0.12)) continue;

      const columnCounts = new Uint32Array(width);
      for (let y = top; y < bottom; y++) {
        const rowOffset = y * width * 4;
        for (let x = 0; x < width; x++) {
          const p = rowOffset + x * 4;
          if (isInk(pixels[p], pixels[p + 1], pixels[p + 2])) columnCounts[x] += 1;
        }
      }

      const colThreshold = Math.max(1, Math.floor(bandHeight * 0.012));
      let minX = width;
      let maxX = -1;
      for (let x = 0; x < width; x++) {
        if (columnCounts[x] >= colThreshold) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
      if (maxX - minX < 18) continue;

      const padX = Math.max(5, Math.round(width * 0.006));
      const cropX = Math.max(0, minX - padX);
      const cropRight = Math.min(width, maxX + padX + 1);
      const cropY = Math.max(0, top - 2);
      const cropBottom = Math.min(height, bottom + 2);
      const crop = document.createElement("canvas");
      crop.width = cropRight - cropX;
      crop.height = cropBottom - cropY;
      crop.getContext("2d").drawImage(
        canvas,
        cropX, cropY, crop.width, crop.height,
        0, 0, crop.width, crop.height
      );
      lines.push(crop);
      if (lines.length >= 120) break;
    }
    return lines;
  }

  async function transcribeLine(canvas, ort, session) {
    const bitmap = await createImageBitmap(await new Promise((resolve) => canvas.toBlob(resolve, "image/png")));
    try {
      const resizedWidth = Math.max(4, Math.round(bitmap.width * IMAGE_HEIGHT / bitmap.height));
      const imageWidth = Math.min(resizedWidth, MAX_WIDTH);
      const width = Math.min(MAX_WIDTH, Math.ceil(imageWidth / STRIDE) * STRIDE);
      const drawnHeight = resizedWidth > MAX_WIDTH
        ? Math.max(1, Math.round(IMAGE_HEIGHT * MAX_WIDTH / resizedWidth))
        : IMAGE_HEIGHT;
      const top = Math.floor((IMAGE_HEIGHT - drawnHeight) / 2);

      const input = document.createElement("canvas");
      input.width = width;
      input.height = IMAGE_HEIGHT;
      const ctx = input.getContext("2d", { alpha: false, willReadFrequently: true });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, IMAGE_HEIGHT);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, top, imageWidth, drawnHeight);

      const rgba = ctx.getImageData(0, 0, width, IMAGE_HEIGHT).data;
      const values = new Float32Array(width * IMAGE_HEIGHT);
      for (let i = 0; i < values.length; i++) {
        const p = i * 4;
        const light = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
        values[i] = light / 255;
      }

      const tensor = new ort.Tensor("float32", values, [1, 1, IMAGE_HEIGHT, width]);
      const outputMap = await session.run({ image: tensor });
      const output = outputMap.logits;
      if (!output || output.dims.length !== 3) throw new Error("Das Handschriftmodell lieferte ein ungültiges Ergebnis.");

      const steps = Math.min(Math.floor((width + STRIDE - 1) / STRIDE), output.dims[1]);
      const classes = output.dims[2];
      const decoded = [];
      let previous = -1;

      for (let t = 0; t < steps; t++) {
        let bestIndex = 0;
        let bestValue = -Infinity;
        const offset = t * classes;
        for (let c = 0; c < classes; c++) {
          const value = output.data[offset + c];
          if (value > bestValue) {
            bestValue = value;
            bestIndex = c;
          }
        }
        if (bestIndex !== 0 && bestIndex !== previous) {
          decoded.push(ALPHABET[bestIndex - 1] || "");
        }
        previous = bestIndex;
      }
      return decoded.join("").trim();
    } finally {
      bitmap.close();
    }
  }

  async function recognize(blob, options) {
    const onProgress = options && options.onProgress;
    report(onProgress, "Kostenloses deutsches Handschriftmodell wird geladen (ca. 10 MB, nur beim ersten Mal) ...");
    const ort = await loadRuntime();
    const session = await loadSession();
    report(onProgress, "Foto wird aufbereitet und in Textzeilen aufgeteilt ...");
    const page = await makePageCanvas(blob);
    const lines = findLines(page);
    if (!lines.length) return { text: "", lines: 0 };

    const results = [];
    for (let i = 0; i < lines.length; i++) {
      report(onProgress, "Handschrift: Zeile " + (i + 1) + " von " + lines.length + " wird erkannt ...");
      const text = await transcribeLine(lines[i], ort, session);
      if (text) results.push(text);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return { text: results.join("\n").trim(), lines: lines.length };
  }

  window.StudySpaceHandwritingOCR = { recognize };
})();