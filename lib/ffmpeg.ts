import { spawn } from "node:child_process";

/**
 * FFmpeg wrapper. yt-dlp already invokes ffmpeg internally for muxing and audio
 * extraction (we pass it via --ffmpeg-location), so this module exists for the
 * occasional standalone transcode the app may want — e.g. a future "convert to
 * a different audio format" feature. Kept small and dependency-free.
 */

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

export interface TranscodeOptions {
  input: string;
  output: string;
  /** Extra ffmpeg args inserted before the output path. */
  args?: string[];
  signal?: AbortSignal;
}

export function transcode(opts: TranscodeOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      FFMPEG,
      ["-y", "-i", opts.input, ...(opts.args ?? []), opts.output],
      { windowsHide: true, signal: opts.signal },
    );
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => reject(err));
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-300)}`)),
    );
  });
}
