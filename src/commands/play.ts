import {
  joinVoiceChannel,
  getVoiceConnection,
  AudioPlayerStatus,
  VoiceConnection,
} from "@discordjs/voice";
import {
  queue,
  playNextSong,
  audioPlayer,
  setConnection,
  client,
  isStartingPlayback,
} from "../index";
import type { Song } from "../index";
import hasDisallowedWords from "../utils/hasDisallowedWords";
import JSONStorage from "../utils/storage";
import { RateLimiter } from "../utils/rateLimit";
import Cache from "../utils/cache";
import {
  safeGetVideoDetails,
  searchYouTubeFirst,
} from "../utils/youtube";

function formatTime(seconds: number | null | undefined): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return "Unknown duration";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${
    remainingSeconds < 10 ? "0" : ""
  }${remainingSeconds} minutes`;
}

function isYouTubeUrl(value: string): boolean {
  return /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(value);
}

function cleanYouTubeUrl(value: string): string {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.replace(/^www\./i, "");

    if (hostname === "youtu.be") {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/watch?v=${videoId}` : value;
    }

    const isYouTubeHost =
      hostname === "youtube.com" || hostname.endsWith(".youtube.com");

    if (isYouTubeHost) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `${parsed.protocol}//${parsed.host}/watch?v=${videoId}`;
      }
    }

    return value;
  } catch {
    return value;
  }
}

const playCommand = {
  name: "play",

  async execute(data: Record<string, any>) {
    try {
      const userId = data.userId ?? 1;
      if (!userId) {
        return "Could not identify user for rate limiting.";
      }

      const query = data.query;
      if (!query) return "No results found for your query.";

      if (RateLimiter.isRateLimited(userId)) {
        const timeRemaining = RateLimiter.getTimeRemaining(userId);
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        return `⏰ **Rate Limited!** You can only add 2 songs per minute. Please wait ${minutes}:${seconds
          .toString()
          .padStart(2, "0")} before adding another song.`;
      }

      RateLimiter.trackRequest(userId);
      const trimmedQuery = String(query).trim();

      let songUrl: string | null = null;
      let songTitle: string | null = null;
      let durationInSeconds: number | null = null;

      if (isYouTubeUrl(trimmedQuery)) {
        songUrl = cleanYouTubeUrl(trimmedQuery);
        const cachedMetadata = Cache.loadMetadata<{
          title?: string;
          url?: string;
          durationInSeconds?: number | null;
          video_details?: { title?: string; durationInSec?: number };
        }>(songUrl);

        if (cachedMetadata) {
          if (typeof cachedMetadata.title === "string") {
            songTitle = cachedMetadata.title;
          } else if (
            cachedMetadata.video_details &&
            typeof cachedMetadata.video_details.title === "string"
          ) {
            songTitle = cachedMetadata.video_details.title;
          }

          const cachedDuration =
            cachedMetadata.durationInSeconds ??
            cachedMetadata.video_details?.durationInSec ??
            null;

          if (
            typeof cachedDuration === "number" &&
            Number.isFinite(cachedDuration)
          ) {
            durationInSeconds = cachedDuration;
          }
        }

        if (!songTitle || durationInSeconds == null) {
          const details = await safeGetVideoDetails(songUrl);
          if (!songTitle && details.title) {
            songTitle = details.title;
          }
          if (durationInSeconds == null) {
            durationInSeconds = details.durationInSeconds;
          }
          try {
            Cache.saveMetadata(songUrl, {
              title: songTitle,
              url: songUrl,
              durationInSeconds,
            });
          } catch (e) {
            console.error("Failed to save metadata to cache:", e);
          }
        }
      } else {
        const searchResult = await searchYouTubeFirst(trimmedQuery);
        if (!searchResult) {
          return "No results found for your query.";
        }

        songUrl = isYouTubeUrl(searchResult.url)
          ? cleanYouTubeUrl(searchResult.url)
          : searchResult.url;
        songTitle = searchResult.title || "Unknown Title";
        durationInSeconds =
          typeof searchResult.durationInSeconds === "number" &&
          Number.isFinite(searchResult.durationInSeconds)
            ? searchResult.durationInSeconds
            : null;

        if (!durationInSeconds || !songTitle) {
          const details = await safeGetVideoDetails(songUrl);
          if (!songTitle) {
            songTitle = details.title;
          }
          if (durationInSeconds == null) {
            durationInSeconds = details.durationInSeconds;
          }
        }

        try {
          Cache.saveMetadata(songUrl, {
            title: songTitle,
            url: songUrl,
            durationInSeconds,
          });
        } catch (e) {
          console.error("Failed to save metadata to cache:", e);
        }
      }

      if (!songUrl) {
        return "No results found for your query.";
      }

      if (!songTitle) {
        songTitle = "Unknown Title";
      }

      const durationFormatted = formatTime(durationInSeconds);

      const song: Song = {
        title: songTitle,
        url: songUrl,
        durationInSeconds,
      };

      const word = hasDisallowedWords(song.title);

      if (word) {
        return `**Cannot Play** Title: "${song.title}" has disallowed word: ${word}.`;
      }

      const guild = client.guilds.cache.get(data.guildId);
      if (!guild) {
        return "Could not find the guild.";
      }

      const voiceChannelId = data.voiceChannelId;
      if (!voiceChannelId) {
        return "Could not find the voice channel.";
      }

      let connection = getVoiceConnection(guild.id);
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannelId,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });
      }

      setConnection(connection);

      queue.push(song);
      JSONStorage.set("queue", queue);
      if (
        audioPlayer.state.status !== AudioPlayerStatus.Playing &&
        !isStartingPlayback
      ) {
        playNextSong(connection);
      }

      return `Added **${song.title}** to the queue! Duration: ${durationFormatted}`;
    } catch (error) {
      console.error("Error handling play command:", error);
      return "There was an error trying to execute this command!";
    }
  },
};

export default playCommand;
