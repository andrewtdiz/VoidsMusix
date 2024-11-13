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

const playCommand = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Search for a song on YouTube and play it")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("The search query to find the song")
        .setRequired(true)
    ),

  async execute(data: Record<string, any>) {
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

      if (durationInSeconds > 60 * 10) {
        return `This song is longer than 10 minutes (${durationFormatted}). Please choose a shorter song.`;
      }

      const song = {
        title: video.title || "Unknown Title",
        url: video.url,
      };

      console.log(song.title);

      if (hasDisallowedWords(song.title)) {
        return `**Cannot Play** Title: "${song.title}" has disallowed words.`;
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
