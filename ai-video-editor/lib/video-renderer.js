import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs/promises";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;
const execFileAsync = promisify(execFile);

export async function probeVideo(inputPath) {
  const { stdout } = await execFileAsync(ffprobePath, [
    "-v", "error",
    "-show_entries", "format=duration:stream=codec_type,width,height",
    "-of", "json",
    inputPath
  ], { maxBuffer: 2 * 1024 * 1024 });
  const data = JSON.parse(stdout);
  const duration = Number(data.format?.duration || 0);
  const videoStream = (data.streams || []).find((stream) => stream.codec_type === "video");
  if (!duration || !videoStream) throw new Error("The uploaded file does not contain a readable video stream.");
  return {
    duration,
    width: Number(videoStream.width || 0),
    height: Number(videoStream.height || 0),
    hasAudio: (data.streams || []).some((stream) => stream.codec_type === "audio")
  };
}

function assTime(value) {
  const centiseconds = Math.max(0, Math.floor(Number(value || 0) * 100));
  const hours = Math.floor(centiseconds / 360000);
  const minutes = Math.floor((centiseconds % 360000) / 6000);
  const seconds = Math.floor((centiseconds % 6000) / 100);
  const fraction = centiseconds % 100;
  return hours + ":" + String(minutes).padStart(2, "0") + ":" +
    String(seconds).padStart(2, "0") + "." + String(fraction).padStart(2, "0");
}

function escapeAss(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "(")
    .replace(/}/g, ")")
    .replace(/\r?\n/g, "\\N")
    .slice(0, 180);
}

async function writeSubtitles(pathname, plan, aspectRatio, style) {
  const portrait = aspectRatio === "9:16";
  const playResX = portrait ? 1080 : aspectRatio === "1:1" ? 1080 : 1920;
  const playResY = portrait ? 1920 : aspectRatio === "1:1" ? 1080 : 1080;
  const fontSize = portrait ? 68 : 52;
  const accent = style === "gaming" ? "&H0000E9FF" : style === "cinematic" ? "&H0000D6FF" : "&H0000F0FF";
  const lines = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: " + playResX,
    "PlayResY: " + playResY,
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding",
    "Style: Default,Arial," + fontSize + ",&H00FFFFFF,&H0000FFFF,&H00111111,&H90000000,1,0,0,0,100,100,0,0,1,4,1,2,75,75,145,1",
    "Style: Title,Arial," + Math.round(fontSize * 1.25) + "," + accent + ",&H0000FFFF,&H00101010,&H90000000,1,0,0,0,100,100,0,0,1,5,2,8,70,70,120,1",
    "",
    "[Events]",
    "Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text"
  ];
  const title = escapeAss(plan.title || "YOUR STORY").replace(/\\N/g, " ");
  if (title) lines.push("Dialogue: 1,0:00:00.00,0:00:02.60,Title,,0,0,0,,{\\fad(120,280)}" + title);
  for (const caption of plan.captions || []) {
    if (caption.end <= caption.start) continue;
    lines.push(
      "Dialogue: 0," + assTime(caption.start) + "," + assTime(caption.end) +
      ",Default,,0,0,0,,{\\fad(70,100)}" + escapeAss(caption.text)
    );
  }
  await fs.writeFile(pathname, lines.join("\n"), "utf8");
}

function escapeFilterPath(value) {
  return value.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function lookFilter(style) {
  if (style === "cinematic") return "eq=contrast=1.12:saturation=0.92:brightness=-0.012";
  if (style === "gaming") return "eq=contrast=1.16:saturation=1.22:brightness=0.005";
  if (style === "clean") return "eq=contrast=1.04:saturation=1.04:brightness=0.005";
  return "eq=contrast=1.11:saturation=1.15:brightness=0.002";
}

function runFfmpeg(args, totalDuration, onProgress) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = "";
    let stdoutBuffer = "";
    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      const pieces = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = pieces.pop() || "";
      for (const line of pieces) {
        if (line.startsWith("out_time_ms=")) {
          const microseconds = Number(line.split("=")[1]);
          if (Number.isFinite(microseconds) && totalDuration > 0) {
            onProgress?.(Math.min(99, (microseconds / 1000000 / totalDuration) * 100));
          }
        }
      }
    });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error("FFmpeg could not render this video. " + stderr.slice(-2200)));
      }
    });
  });
}

export async function renderVideo({ inputPath, outputPath, plan, aspectRatio, style, hasAudio, onProgress }) {
  const segments = plan.segments;
  if (!segments?.length) throw new Error("The edit plan did not contain any usable video segments.");

  const dimensions = aspectRatio === "9:16" ? [1080, 1920] :
    aspectRatio === "1:1" ? [1080, 1080] : [1920, 1080];
  const width = dimensions[0];
  const height = dimensions[1];
  const dynamic = style === "dynamic" || style === "gaming";
  const scaleWidth = Math.round(width * (dynamic ? 1.06 : 1.02));
  const scaleHeight = Math.round(height * (dynamic ? 1.06 : 1.02));
  const visualFilter = lookFilter(style);
  const filters = [];

  segments.forEach((segment, index) => {
    const start = Math.max(0, Number(segment.start) || 0);
    const end = Math.max(start + 0.1, Number(segment.end) || start + 0.1);
    filters.push(
      "[0:v]trim=start=" + start.toFixed(3) + ":end=" + end.toFixed(3) +
      ",setpts=PTS-STARTPTS,scale=" + scaleWidth + ":" + scaleHeight +
      ":force_original_aspect_ratio=increase,crop=" + width + ":" + height +
      ",setsar=1,fps=30," + visualFilter + "[v" + index + "]"
    );
    if (hasAudio) {
      filters.push(
        "[0:a]atrim=start=" + start.toFixed(3) + ":end=" + end.toFixed(3) +
        ",asetpts=PTS-STARTPTS,aresample=48000[a" + index + "]"
      );
    }
  });

  const concatInputs = [];
  segments.forEach((_segment, index) => {
    concatInputs.push("[v" + index + "]");
    if (hasAudio) concatInputs.push("[a" + index + "]");
  });
  filters.push(
    concatInputs.join("") + "concat=n=" + segments.length + ":v=1:a=" + (hasAudio ? 1 : 0) +
    (hasAudio ? "[vcat][acat]" : "[vcat]")
  );

  const subtitlesPath = path.join(path.dirname(outputPath), "captions.ass");
  await writeSubtitles(subtitlesPath, plan, aspectRatio, style);
  filters.push("[vcat]ass='" + escapeFilterPath(subtitlesPath) + "'[vout]");
  if (hasAudio) filters.push("[acat]loudnorm=I=-16:TP=-1.5:LRA=11[aout]");

  const outputDuration = segments.reduce((sum, segment) => sum + segment.end - segment.start, 0);
  const args = [
    "-y", "-i", inputPath,
    "-filter_complex", filters.join(";"),
    "-map", "[vout]"
  ];
  if (hasAudio) args.push("-map", "[aout]");
  args.push(
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
    "-pix_fmt", "yuv420p", "-r", "30",
    "-movflags", "+faststart",
    "-progress", "pipe:1", "-nostats",
    "-t", outputDuration.toFixed(3),
    outputPath
  );
  await runFfmpeg(args, outputDuration, onProgress);
}
