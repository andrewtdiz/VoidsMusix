import { SlashCommandBuilder } from "discord.js";
import { getLooping, toggleLooping } from "../utils/looping";

export default {
  name: "loop",

  async execute(data: Record<string, any>) {
    toggleLooping();

    return `Looping has been set to: \`${getLooping()}\``;
  },
};
