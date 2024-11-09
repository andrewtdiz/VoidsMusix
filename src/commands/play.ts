import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import {
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnection,
} from "@discordjs/voice";
import { queue, playNextSong, audioPlayer, setConnection } from "../index";
import play from "play-dl";
import { logAction } from "../utils/logAction";
import { isInSameVoiceChannelAsBot } from "../utils/isInSameVoiceChannelAsBot";

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

  async execute(interaction: CommandInteraction<CacheType>) {
    try {
      await interaction.deferReply();

      const query = interaction.options.get("query")?.value as string;
      const searchResult = await play.search(query, { limit: 1 });
      const video = searchResult[0];

      if (!video) {
        return interaction.editReply("No results found for your query.");
      }

      if (!isInSameVoiceChannelAsBot(interaction)) {
        return interaction.editReply(
          "You need to be in the same voice channel as the bot to play music!"
        );
      }

      const songInfo = await play.video_info(video.url);
      const durationInSeconds = songInfo.video_details.durationInSec;
      const durationFormatted = formatTime(durationInSeconds);

      if (durationInSeconds > 60 * 10) {
        return interaction.editReply(
          `This song is longer than 10 minutes (${durationFormatted}). Please choose a shorter song.`
        );
      }

      const connection = getConnection(interaction);

      if (!connection) {
        return interaction.editReply(
          "You need to be in a voice channel to play music!"
        );
      }

      setConnection(connection);

      const song = {
        title: video.title || "Unknown Title",
        url: video.url,
      };

      queue.push(song);
      await interaction.editReply(
        `Added **${song.title}** to the queue! Duration: ${durationFormatted}`
      );

      logAction(
        interaction.client,
        "Play",
        `Added ${song.title} to the queue.`,
        interaction.user,
        song.url
      );

      if (audioPlayer.state.status !== AudioPlayerStatus.Playing) {
        playNextSong(connection);
      }
    } catch (error) {
      console.error("Error handling play command:", error);
      try {
        if (interaction.deferred) {
          await interaction.editReply(
            "There was an error trying to execute this command!"
          );
        } else {
          await interaction.reply(
            "There was an error trying to execute this command!"
          );
        }
      } catch (replyError) {
        console.error("Error sending reply:", replyError);
      }
    }
  },
};

export default playCommand;
