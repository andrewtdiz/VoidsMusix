import fs from "fs";
import path from "path";
import { createHash } from "crypto";

export default class Cache {
  private static ensureDirExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`[Cache] Created cache directory: ${dirPath}`);
    } else {
      console.log(`[Cache] Cache directory exists: ${dirPath}`);
    }
  }

  public static getCacheDir(): string {
    const dir = path.join(process.cwd(), "music-cache");
    this.ensureDirExists(dir);
    console.log(`[Cache] Using cache directory: ${dir}`);
    return dir;
  }

  public static urlToBaseName(url: string): string {
    const hash = createHash("sha256").update(url).digest("hex");
    console.log(`[Cache] urlToBaseName`, { url, hash });
    return hash;
  }

  public static getPathsForUrl(url: string): {
    audioPath: string;
    metadataPath: string;
  } {
    const base = this.urlToBaseName(url);
    const dir = this.getCacheDir();
    const audioPath = path.join(dir, `${base}.mp3`);
    const metadataPath = path.join(dir, `${base}.json`);
    console.log(`[Cache] Paths for URL`, { url, audioPath, metadataPath });
    return { audioPath, metadataPath };
  }

  public static isFileZeroBytes(filePath: string): boolean {
    try {
      const stats = fs.statSync(filePath);
      return stats.size === 0;
    } catch {
      return false;
    }
  }

  public static deleteZeroByteFiles(url: string): void {
    const { audioPath, metadataPath } = this.getPathsForUrl(url);

    try {
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log(`[Cache] Deleted 0-byte audio file: ${audioPath}`);
      }
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
        console.log(
          `[Cache] Deleted associated metadata file: ${metadataPath}`,
        );
      }
    } catch (error) {
      console.error(`[Cache] Error deleting files for URL ${url}:`, error);
    }
  }

  public static shouldRetryDownload(
    url: string,
    currentAttempt: number,
  ): boolean {
    const maxAttempts = 2;
    if (currentAttempt >= maxAttempts) {
      console.log(
        `[Cache] Max download attempts (${maxAttempts}) reached for URL: ${url}`,
      );
      return false;
    }

    // Check if we have a 0-byte file that needs retry
    const { audioPath } = this.getPathsForUrl(url);
    if (fs.existsSync(audioPath) && this.isFileZeroBytes(audioPath)) {
      console.log(
        `[Cache] 0-byte file detected, retrying download (attempt ${currentAttempt + 1}/${maxAttempts}): ${url}`,
      );
      this.deleteZeroByteFiles(url);
      return true;
    }

    return false;
  }

  public static hasAudioAndMetadata(url: string): boolean {
    const found = this.findLocalForUrl(url);
    if (found) {
      // Check if audio file has valid size
      if (this.isFileZeroBytes(found.audioPath)) {
        console.log(`[Cache] Found cached file but it's 0 bytes, deleting`, {
          url,
          audioPath: found.audioPath,
        });
        this.deleteZeroByteFiles(url);
        return false;
      }
      console.log(`[Cache] hasAudioAndMetadata: found by scan`, {
        url,
        ...found,
      });
      return true;
    }
    const { audioPath, metadataPath } = this.getPathsForUrl(url);
    const hasAudio = fs.existsSync(audioPath);
    const hasMeta = fs.existsSync(metadataPath);

    // Check if audio file exists but is 0 bytes
    if (hasAudio && this.isFileZeroBytes(audioPath)) {
      console.log(`[Cache] Audio file exists but is 0 bytes, deleting`, {
        url,
        audioPath,
      });
      this.deleteZeroByteFiles(url);
      return false;
    }

    console.log(`[Cache] hasAudioAndMetadata: direct check`, {
      url,
      hasAudio,
      hasMeta,
      audioPath,
      metadataPath,
    });
    return hasAudio && hasMeta;
  }

  public static saveMetadata(url: string, metadata: any): string {
    const { metadataPath } = this.getPathsForUrl(url);
    this.ensureDirExists(path.dirname(metadataPath));
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
    console.log(`[Cache] Saved metadata`, { url, metadataPath });
    return metadataPath;
  }

  public static loadMetadata<T = any>(url: string): T | null {
    const { metadataPath } = this.getPathsForUrl(url);
    try {
      if (!fs.existsSync(metadataPath)) {
        return null;
      }
      const content = fs.readFileSync(metadataPath, "utf8");
      const metadata = JSON.parse(content) as T;
      console.log(`[Cache] Loaded metadata`, { url, metadataPath });
      return metadata;
    } catch (error) {
      console.error(`[Cache] Failed to load metadata for URL ${url}:`, error);
      return null;
    }
  }

  public static findLocalForUrl(
    url: string,
  ): { audioPath: string; metadataPath: string } | null {
    const dir = this.getCacheDir();
    console.log(`[Cache] Scanning cache directory for URL`, { url, dir });
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.endsWith(".json")) continue;
        const metadataPath = path.join(dir, entry.name);
        try {
          const content = fs.readFileSync(metadataPath, "utf8");
          const json = JSON.parse(content);
          if (json && typeof json.url === "string" && json.url === url) {
            const base = entry.name.slice(0, -".json".length);
            const audioPath = path.join(dir, `${base}.mp3`);
            if (fs.existsSync(audioPath)) {
              // Check if audio file is 0 bytes
              if (this.isFileZeroBytes(audioPath)) {
                console.log(
                  `[Cache] Found cached file but it's 0 bytes, deleting`,
                  { url, audioPath },
                );
                this.deleteZeroByteFiles(url);
                continue;
              }
              console.log(`[Cache] Match found for URL`, {
                url,
                audioPath,
                metadataPath,
              });
              return { audioPath, metadataPath };
            }
          }
        } catch {
          // ignore malformed metadata
        }
      }
    } catch {
      // ignore missing dir
    }
    console.log(`[Cache] No local match found for URL`, { url });
    return null;
  }
}
