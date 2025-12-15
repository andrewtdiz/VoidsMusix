import play from "play-dl";
import yts from "yt-search";

type MaybeNumber = number | null;

interface BasicVideoDetails {
  title: string;
  durationInSeconds: MaybeNumber;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./i, "");

    if (hostname === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com")
    ) {
      const watchId = parsed.searchParams.get("v");
      if (watchId) return watchId;

      if (parts.length >= 2 && ["shorts", "embed", "live"].includes(parts[0])) {
        return parts[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function safeGetVideoDetails(
  url: string,
): Promise<BasicVideoDetails> {
  const videoId = extractYouTubeVideoId(url);

  if (videoId) {
    try {
      const video = await yts({ videoId });
      const duration =
        isFiniteNumber((video as any)?.seconds)
          ? (video as any).seconds
          : isFiniteNumber((video as any)?.duration?.seconds)
            ? (video as any).duration.seconds
            : null;

      return {
        title: (video as any)?.title || "Unknown Title",
        durationInSeconds: duration,
      };
    } catch (error) {
      console.error("Failed to fetch video info via yt-search:", error);
    }
  }

  try {
    const info = await play.video_info(url);
    const duration = isFiniteNumber(info.video_details.durationInSec)
      ? info.video_details.durationInSec
      : null;

    return {
      title: info.video_details.title || "Unknown Title",
      durationInSeconds: duration,
    };
  } catch (error) {
    console.error("Failed to fetch video info via play-dl:", error);
  }

  return { title: "Unknown Title", durationInSeconds: null };
}

export async function searchYouTubeFirst(query: string): Promise<{
  url: string;
  title: string;
  durationInSeconds: MaybeNumber;
} | null> {
  try {
    const results = await yts(query);
    const video = results?.videos?.[0];
    if (video) {
      const duration = isFiniteNumber((video as any)?.seconds)
        ? (video as any).seconds
        : isFiniteNumber((video as any)?.duration?.seconds)
          ? (video as any).duration.seconds
          : null;

      return {
        url: (video as any).url,
        title: (video as any).title || "Unknown Title",
        durationInSeconds: duration,
      };
    }
  } catch (error) {
    console.error("Failed to search via yt-search:", error);
  }

  return null;
}
