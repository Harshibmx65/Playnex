export interface VideoChapter {
  timestamp: number; // in seconds
  timestamp_formatted: string; // "01:45" or "01:05:20"
  title: string;
}

/**
 * Extracts creator timestamp chapters from video descriptions.
 * Handles diverse creator formatting (e.g. 00:00 - Title, (01:25) Title, [1:02:15] Title, 0:15 Intro, etc.)
 */
export function parseCreatorTimestamps(description?: string | null): VideoChapter[] {
  if (!description || typeof description !== 'string') {
    return [];
  }

  const lines = description.split(/\r?\n/);
  const chapters: VideoChapter[] = [];
  const seenSeconds = new Set<number>();

  // Regular expression to match timestamps in formats:
  // HH:MM:SS or MM:SS (e.g. 0:00, 00:00, 1:45, 01:45, 1:05:20, 01:05:20)
  const timestampRegex = /(?:\[|\(|\b)(?:(\d{1,2}):)?(\d{1,2}):([0-5]\d)(?:\]|\)|\b)/;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const line = rawLine.trim();
    if (!line) continue;

    // Skip lines that are purely URLs
    if (line.startsWith('http://') || line.startsWith('https://')) continue;

    const match = line.match(timestampRegex);
    if (!match) continue;

    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    // Extract topic title by stripping timestamp & leading/trailing delimiters
    let title = line.replace(match[0], '').trim();
    title = title.replace(/^[\s\-–—:•|~\]\)\.]+|[\s\-–—:•|~\[\(\.]+$/g, '').trim();

    if (!title || title.length < 2) {
      title = `Chapter ${chapters.length + 1}`;
    }

    if (!title.startsWith('http://') && !title.startsWith('https://')) {
      if (!seenSeconds.has(totalSeconds)) {
        seenSeconds.add(totalSeconds);
        const formatted = hours > 0
          ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        chapters.push({
          timestamp: totalSeconds,
          timestamp_formatted: formatted,
          title,
        });
      }
    }
  }

  // Sort chronologically by timestamp
  chapters.sort((a, b) => a.timestamp - b.timestamp);
  return chapters;
}
