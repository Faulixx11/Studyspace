import "dotenv/config";
import express from "express";
import multer from "multer";
import helmet from "helmet";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { probeVideo, renderVideo } from "./lib/video-renderer.js";
import { createEditPlan } from "./lib/ai-editor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const maxUploadMb = Math.max(20, Number(process.env.MAX_UPLOAD_MB || 500));
const ttlHours = Math.max(1, Number(process.env.JOB_TTL_HOURS || 24));
const storageDir = path.join(__dirname, "storage");
const tempDir = path.join(os.tmpdir(), "cutline-uploads");
const jobs = new Map();

await fs.mkdir(storageDir, { recursive: true });
await fs.mkdir(tempDir, { recursive: true });

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));

const upload = multer({
  dest: tempDir,
  limits: { fileSize: maxUploadMb * 1024 * 1024, files: 1 }
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    maxUploadMb,
    message: process.env.OPENAI_API_KEY ? "AI editing is configured." : "Demo mode: add an API key for AI edit decisions."
  });
});

app.post("/api/jobs", upload.single("video"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a video file first." });
    const allowedExtensions = new Set([".mp4", ".mov", ".m4v", ".mkv", ".webm"]);
    const extension = path.extname(req.file.originalname || "").toLowerCase() || ".mp4";
    if (!allowedExtensions.has(extension) || !String(req.file.mimetype || "").startsWith("video/")) {
      await fs.rm(req.file.path, { force: true });
      return res.status(415).json({ error: "Supported formats: MP4, MOV, M4V, MKV and WebM." });
    }

    const id = randomUUID();
    const folder = path.join(storageDir, id);
    await fs.mkdir(folder, { recursive: true });
    const sourcePath = path.join(folder, "source" + extension);
    await fs.rename(req.file.path, sourcePath);

    const job = {
      id,
      folder,
      sourcePath,
      status: "queued",
      progress: 2,
      message: "Your video is in the queue.",
      createdAt: Date.now(),
      plan: null,
      outputPath: path.join(folder, "cutline-export.mp4"),
      error: null
    };
    jobs.set(id, job);
    res.status(202).json({ id, status: job.status });
    processJob(job, {
      prompt: String(req.body.prompt || "").slice(0, 4000),
      style: String(req.body.style || "dynamic"),
      aspectRatio: String(req.body.aspectRatio || "9:16")
    }).catch((error) => {
      job.status = "error";
      job.error = error.message || "The edit failed.";
      job.message = job.error;
      job.progress = 0;
      console.error("Job failed:", id, error);
    });
  } catch (error) {
    next(error);
  }
});

async function processJob(job, settings) {
  const metadata = await probeVideo(job.sourcePath);
  job.progress = 8;
  job.status = "analyzing";
  job.message = "Listening to the video and understanding your instructions…";

  const plan = await createEditPlan({
    inputPath: job.sourcePath,
    duration: metadata.duration,
    prompt: settings.prompt,
    style: settings.style,
    aspectRatio: settings.aspectRatio,
    hasAudio: metadata.hasAudio
  });
  job.plan = {
    title: plan.title,
    notes: plan.notes,
    segments: plan.segments,
    captionsCount: plan.captions.length,
    sourceDuration: metadata.duration,
    outputDuration: plan.outputDuration,
    aiUsed: plan.aiUsed
  };

  job.status = "rendering";
  job.progress = 48;
  job.message = "Building the edit and rendering your MP4…";
  await renderVideo({
    inputPath: job.sourcePath,
    outputPath: job.outputPath,
    plan,
    aspectRatio: settings.aspectRatio,
    style: settings.style,
    hasAudio: metadata.hasAudio,
    onProgress: (value) => {
      job.progress = Math.max(48, Math.min(98, 48 + Math.round(value * 0.5)));
      job.message = "Rendering the edit… " + Math.round(value) + "%";
    }
  });

  job.status = "complete";
  job.progress = 100;
  job.message = "Your edit is ready.";
  job.completedAt = Date.now();
}

function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    error: job.error,
    resultReady: job.status === "complete",
    plan: job.plan
  };
}

app.get("/api/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "This edit was not found. It may have expired." });
  res.json(publicJob(job));
});

app.get("/api/jobs/:id/video", async (req, res, next) => {
  try {
    const job = jobs.get(req.params.id);
    if (!job || job.status !== "complete") return res.status(404).json({ error: "The rendered video is not ready." });
    await fs.access(job.outputPath);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "no-store");
    if (req.query.download === "1") {
      res.setHeader("Content-Disposition", 'attachment; filename="cutline-edit.mp4"');
    }
    createReadStream(job.outputPath).pipe(res);
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "That video is too large. The current upload limit is " + maxUploadMb + " MB." });
  }
  res.status(500).json({ error: error.message || "Unexpected server error." });
});

setInterval(async () => {
  const cutoff = Date.now() - ttlHours * 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt < cutoff) {
      jobs.delete(id);
      await fs.rm(job.folder, { recursive: true, force: true }).catch(() => {});
    }
  }
}, 60 * 60 * 1000).unref();

app.listen(port, () => {
  console.log("CUTLINE is running at http://localhost:" + port);
  console.log(process.env.OPENAI_API_KEY ? "AI mode enabled." : "Demo mode: set OPENAI_API_KEY to enable AI editing.");
});
