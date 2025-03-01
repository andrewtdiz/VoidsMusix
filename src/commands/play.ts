import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import {
  joinVoiceChannel,
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

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${
    remainingSeconds < 10 ? "0" : ""
  }${remainingSeconds} minutes`;
}

function getConnection(
  interaction: CommandInteraction<CacheType>
): VoiceConnection | null {
  const member = interaction.member;
  const guild = interaction.guild;

  if (!member || !("voice" in member) || !member.voice.channel || !guild) {
    console.log("Invalid member.");
    return null;
  }

  return joinVoiceChannel({
    channelId: member.voice.channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });
}

let currentExecution: Promise<string> | null = null;

const playCommand = {
  name: "play",

  async execute(data: Record<string, any>) {
    // If there's a current execution, wait for it to complete
    if (currentExecution) {
      await currentExecution;
    }

    // Create a new promise for this execution
    const executionPromise = (async () => {
      try {
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

        const connection = joinVoiceChannel({
          channelId: voiceChannelId,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });

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
      } finally {
        currentExecution = null;
      }
    })();

    // Set the current execution to this promise
    currentExecution = executionPromise;

    // Return the result
    return await executionPromise;
  },
};

export default playCommand;
