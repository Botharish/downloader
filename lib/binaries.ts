import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function pathEntries(): string[] {
  return (process.env.PATH || "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function executableNames(command: string): string[] {
  if (path.extname(command)) return [command];
  const extensions =
    process.platform === "win32"
      ? (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";")
      : [""];
  return [command, ...extensions.map((ext) => `${command}${ext.toLowerCase()}`)];
}

function firstExisting(paths: Array<string | undefined>): string | null {
  for (const candidate of paths) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

function findOnPath(command: string): string | null {
  for (const dir of pathEntries()) {
    for (const name of executableNames(command)) {
      const candidate = path.join(dir, name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function findPythonScript(command: string): string | null {
  if (process.platform !== "win32") return null;

  const roots = [
    process.env.APPDATA && path.join(process.env.APPDATA, "Python"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", "Python"),
  ].filter(Boolean) as string[];

  for (const root of roots) {
    try {
      for (const versionDir of readdirSync(root)) {
        const candidate = path.join(root, versionDir, "Scripts", `${command}.exe`);
        if (existsSync(candidate)) return candidate;
      }
    } catch {
      /* ignore unavailable roots */
    }
  }
  return null;
}

function findWingetFfmpeg(): string | null {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) return null;

  const packagesDir = path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages");
  try {
    const packageDir = readdirSync(packagesDir).find((name) =>
      name.toLowerCase().startsWith("gyan.ffmpeg_"),
    );
    if (!packageDir) return null;

    const fullPackageDir = path.join(packagesDir, packageDir);
    const ffmpegDir = readdirSync(fullPackageDir).find((name) =>
      name.toLowerCase().startsWith("ffmpeg-"),
    );
    if (!ffmpegDir) return null;

    const candidate = path.join(fullPackageDir, ffmpegDir, "bin", "ffmpeg.exe");
    return existsSync(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function resolveYtdlpPath(): string {
  return (
    firstExisting([process.env.YTDLP_PATH]) ||
    findOnPath("yt-dlp") ||
    findPythonScript("yt-dlp") ||
    "yt-dlp"
  );
}

export function resolveFfmpegPath(): string {
  return (
    firstExisting([process.env.FFMPEG_PATH]) ||
    findOnPath("ffmpeg") ||
    findWingetFfmpeg() ||
    "ffmpeg"
  );
}

export function ffmpegLocationArgs(): string[] {
  const ffmpeg = resolveFfmpegPath();
  return path.isAbsolute(ffmpeg) ? ["--ffmpeg-location", ffmpeg] : [];
}
