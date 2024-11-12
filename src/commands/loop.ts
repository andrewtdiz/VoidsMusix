import { SlashCommandBuilder } from "discord.js";
import { getLooping, toggleLooping } from "../utils/looping";

export default {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Loops the current song"),

  async execute(data: Record<string, any>) {
    toggleLooping();

    return `Looping has been set to: \`${getLooping()}\``;
  },
};
