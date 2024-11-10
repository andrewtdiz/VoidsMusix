import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { audioPlayer, currentSong, client } from "../index";
import { AudioPlayerStatus } from "@discordjs/voice";
import play from "play-dl";
import { logAction } from "../utils/logAction";
import { isInSameVoiceChannelAsBot } from "../utils/isInSameVoiceChannelAsBot";

let playbackStartTime: number | null = null;

export default {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause the current song"),

  async execute(interaction: CommandInteraction) {
    if (!isInSameVoiceChannelAsBot(interaction)) {
      return interaction.reply({
        content:
          "You need to be in the same voice channel as the bot to stop the music!",
      });
    }

    if (audioPlayer.state.status === AudioPlayerStatus.Playing && currentSong) {
      audioPlayer.pause();

      const songInfo = await play.video_info(currentSong.url);
      const durationInSeconds = songInfo.video_details.durationInSec;
      const currentTime = Date.now();
      const elapsed = Math.floor(
        (currentTime - (playbackStartTime ?? currentTime)) / 1000
      );
      const remainingTime = durationInSeconds - elapsed;
      const remainingFormatted = new Date(remainingTime * 1000)
        .toISOString()
        .substr(11, 8);

      await interaction.reply(
        `Paused the current song. Time left: ${remainingFormatted}`
      );

      logAction(
        client,
        "Pause",
        `Paused at ${remainingFormatted} remaining`,
        interaction.user,
        currentSong.url
      );
    } else {
      await interaction.reply("No song is currently playing.");
    }
  },
};
