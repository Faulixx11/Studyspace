export function normalizeSegments(input, duration) {
  const maxDuration = Math.max(0.1, Number(duration) || 0.1);
  const source = Array.isArray(input) ? input : [];
  const cleaned = source
    .map((item) => ({
      start: Math.max(0, Math.min(maxDuration, Number(item?.start))),
      end: Math.max(0, Math.min(maxDuration, Number(item?.end))),
      reason: String(item?.reason || "").slice(0, 140)
    }))
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end - item.start >= 0.45)
    .sort((a, b) => a.start - b.start)
    .slice(0, 18);

  if (!cleaned.length) return [{ start: 0, end: maxDuration, reason: "Keep the source video" }];

  const result = [];
  for (const item of cleaned) {
    const previous = result[result.length - 1];
    if (!previous || item.start >= previous.end) {
      result.push(item);
    } else if (item.end > previous.end) {
      item.start = previous.end;
      if (item.end - item.start >= 0.45) result.push(item);
    }
  }
  return result.length ? result : [{ start: 0, end: maxDuration, reason: "Keep the source video" }];
}

function splitCaption(text, maxChars = 42) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= 2) return lines.join("\\N");
  return lines.slice(0, 2).join("\\N");
}

export function buildCaptionTimeline(transcriptSegments, editSegments) {
  const events = [];
  let outputOffset = 0;
  for (const edit of editSegments) {
    for (const spoken of transcriptSegments || []) {
      const spokenStart = Math.max(edit.start, Number(spoken.start) || 0);
      const spokenEnd = Math.min(edit.end, Number(spoken.end) || 0);
      if (spokenEnd - spokenStart < 0.18) continue;
      const text = splitCaption(spoken.text);
      if (!text) continue;
      events.push({
        start: outputOffset + spokenStart - edit.start,
        end: outputOffset + spokenEnd - edit.start,
        text
      });
    }
    outputOffset += edit.end - edit.start;
  }
  return events.slice(0, 1200);
}
