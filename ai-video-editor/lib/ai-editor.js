import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { normalizeSegments, buildCaptionTimeline } from "./edit-plan.js";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error("Audio analysis failed: " + stderr.slice(-1800)));
    });
  });
}

async function transcribe(inputPath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const audioPath = path.join(os.tmpdir(), "cutline-audio-" + Date.now() + ".mp3");
  try {
    await run(ffmpegPath, [
      "-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000",
      "-b:a", "48k", "-f", "mp3", audioPath
    ]);
    const audio = await fs.readFile(audioPath);
    if (audio.byteLength > 24 * 1024 * 1024) {
      throw new Error("The audio track is too long for one transcription request. Try a shorter video (around 45 minutes or less).");
    }

    const form = new FormData();
    form.append("file", new Blob([audio], { type: "audio/mpeg" }), "audio.mp3");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey },
      body: form
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error?.message || "The transcription service returned an error.");
    }
    return {
      text: String(payload.text || ""),
      segments: Array.isArray(payload.segments) ? payload.segments : []
    };
  } finally {
    await fs.rm(audioPath, { force: true }).catch(() => {});
  }
}

async function askForEdit({ prompt, transcript, duration, style, aspectRatio }) {
  const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
  const system = [
    "You are a careful professional video editor. Return only a valid JSON object.",
    "The user gives instructions for editing one source video. Use only information in the transcript; do not invent events or quotes.",
    "Return keys: title (short hook, max 7 words), notes (one sentence), segments (array of {start,end,reason}).",
    "Segment times must be seconds in the ORIGINAL source video. Keep segments chronological, non-overlapping, inside the supplied duration.",
    "For a highlight/short request, select the most compelling complete thoughts and remove dead space/repetition. For a request to keep everything, return one full-length segment. Do not create dozens of tiny cuts.",
    "Keep between 1 and 18 segments. Avoid cutting words in half; use transcript segment boundaries where possible.",
    "The title must not make a factual claim absent from the transcript. Return no captions; subtitles are generated from the timestamped transcript."
  ].join(" ");

  const user = {
    instruction: prompt || "Create a polished, engaging edit. Remove long silences and repetition while preserving the meaning.",
    source_duration_seconds: duration,
    preferred_style: style,
    output_aspect_ratio: aspectRatio,
    transcript: transcript.text.slice(0, 50000),
    timestamped_transcript: transcript.segments.slice(0, 1600).map((segment) => ({
      start: Number(segment.start) || 0,
      end: Number(segment.end) || 0,
      text: String(segment.text || "").slice(0, 500)
    }))
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) }
      ]
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || "The AI editing planner returned an error.");
  }
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("The AI editing planner returned an empty response.");
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("The AI editing planner returned invalid edit instructions. Please try again.");
  }
}

export async function createEditPlan({ inputPath, duration, prompt, style, aspectRatio, hasAudio }) {
  const safeDuration = Math.max(0.1, Number(duration) || 0.1);
  const transcript = hasAudio ? await transcribe(inputPath) : null;

  if (!process.env.OPENAI_API_KEY || !transcript) {
    const segments = [{ start: 0, end: safeDuration, reason: "Keep the source video" }];
    return {
      aiUsed: false,
      title: "YOUR VIDEO",
      notes: "Demo render only. Add OPENAI_API_KEY on the server to enable transcript-aware AI cuts and captions.",
      segments,
      captions: [],
      outputDuration: safeDuration
    };
  }

  const aiPlan = await askForEdit({
    prompt,
    transcript,
    duration: safeDuration,
    style,
    aspectRatio
  });
  const segments = normalizeSegments(aiPlan.segments, safeDuration);
  const captions = buildCaptionTimeline(transcript.segments, segments);
  const outputDuration = segments.reduce((sum, segment) => sum + (segment.end - segment.start), 0);

  return {
    aiUsed: true,
    title: String(aiPlan.title || "YOUR STORY").slice(0, 70),
    notes: String(aiPlan.notes || "AI edit plan generated from the spoken content.").slice(0, 260),
    segments,
    captions,
    outputDuration
  };
}
