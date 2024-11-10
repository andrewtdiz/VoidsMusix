import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { client } from "../index";
import { logAction } from "../utils/logAction";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency"),

  async execute(interaction: CommandInteraction) {
    const sent = await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply({
      content: `Latency: **${latency}ms**\nAPI Latency: **${apiLatency}ms**\n*v1.01*`,
    });

    logAction(
      client,
      "Ping",
      `Checked latency: ${latency}ms, API Latency: ${apiLatency}ms`,
      interaction.user
    );
  },
};
