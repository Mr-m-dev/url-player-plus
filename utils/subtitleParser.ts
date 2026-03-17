export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

function timeToMs(timeStr: string): number {
  const clean = timeStr.trim().replace(",", ".");
  const parts = clean.split(":");
  if (parts.length === 3) {
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    return Math.round((h * 3600 + m * 60 + s) * 1000);
  }
  if (parts.length === 2) {
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    return Math.round((m * 60 + s) * 1000);
  }
  return 0;
}

export function parseSRT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    let timingLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        timingLine = i;
        break;
      }
    }
    if (timingLine === -1) continue;

    const timing = lines[timingLine].split("-->");
    if (timing.length !== 2) continue;

    const start = timeToMs(timing[0]);
    const end = timeToMs(timing[1]);
    const text = lines
      .slice(timingLine + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (text && end > start) {
      cues.push({ start, end, text });
    }
  }

  return cues.sort((a, b) => a.start - b.start);
}

export function parseVTT(content: string): SubtitleCue[] {
  const cleaned = content.replace(/^WEBVTT.*\n?/, "").replace(/NOTE[^\n]*\n?/g, "");
  return parseSRT(cleaned);
}

export function parseSubtitles(content: string, filename?: string): SubtitleCue[] {
  const lower = (filename ?? "").toLowerCase();
  if (lower.endsWith(".vtt") || content.trimStart().startsWith("WEBVTT")) {
    return parseVTT(content);
  }
  return parseSRT(content);
}

export function getCurrentCue(cues: SubtitleCue[], positionMs: number): SubtitleCue | null {
  for (const cue of cues) {
    if (positionMs >= cue.start && positionMs <= cue.end) {
      return cue;
    }
  }
  return null;
}
