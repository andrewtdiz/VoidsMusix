import { SlashCommandBuilder } from "discord.js";
import { audioPlayer, currentSong } from "../index";
import { AudioPlayerStatus } from "@discordjs/voice";
import { looping, toggleLooping } from "../utils/looping";

export default {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Loops the current song"),

  async execute(data: Record<string, any>) {
    toggleLooping();

    return `Looping has been set to: \`${looping}\``;
  },
};
