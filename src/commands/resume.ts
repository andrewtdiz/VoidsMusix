import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { audioPlayer, currentSong, client } from "../index";
import { AudioPlayerStatus } from "@discordjs/voice";
import { logAction } from "../utils/logAction";
import { isInSameVoiceChannelAsBot } from "../utils/isInSameVoiceChannelAsBot";

export default {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume the paused song"),

  async execute(data: Record<string, any>) {
    if (audioPlayer.state.status === AudioPlayerStatus.Paused && currentSong) {
      audioPlayer.unpause();
      return "Resumed the current song.";
    } else {
      return "No song is currently paused.";
    }
  },
};
