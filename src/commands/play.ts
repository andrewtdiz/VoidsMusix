import { SlashCommandBuilder } from "discord.js";
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
} from "../index";
import play from "play-dl";
import hasDisallowedWords from "../utils/hasDisallowedWords";
import JSONStorage from "../utils/storage";
import { RateLimiter } from "../utils/rateLimit";

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds} minutes`;
}

const playCommand = {
  name: "play",

  async execute(data: Record<string, any>) {
    try {
      const userId = data.userId ?? 0;
      if (!userId) {
        return "Could not identify user for rate limiting.";
      }

      if (RateLimiter.isRateLimited(userId)) {
        const timeRemaining = RateLimiter.getTimeRemaining(userId);
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        return `⏰ **Rate Limited!** You can only add 2 songs per minute. Please wait ${minutes}:${seconds
          .toString()
          .padStart(2, "0")} before adding another song.`;
      }

      RateLimiter.trackRequest(userId);

      const query = data.query;
      if (!query) return "No results found for your query.";
      const searchResult = await play.search(query, { limit: 1 });
      const video = searchResult[0];

      if (!video) {
        return "No results found for your query.";
      }

      const songInfo = await play.video_info(video.url);
      const durationInSeconds = songInfo.video_details.durationInSec;
      const durationFormatted = formatTime(durationInSeconds);

      // if (durationInSeconds > 60 * 10) {
      //   return `This song is longer than 10 minutes (${durationFormatted}). Please choose a shorter song.`;
      // }

      const song = {
        title: video.title || "Unknown Title",
        url: video.url,
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
      if (audioPlayer.state.status !== AudioPlayerStatus.Playing) {
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
