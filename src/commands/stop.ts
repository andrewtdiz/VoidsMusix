import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  GuildMember,
} from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { queue, audioPlayer, setCurrentSong } from "../index";
import { logAction } from "../utils/logAction";
import { isInSameVoiceChannelAsBot } from "../utils/isInSameVoiceChannelAsBot";

const stopCommand = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop the music and clear the queue"),

  async execute(interaction: CommandInteraction<CacheType>) {
    const connection = getVoiceConnection(interaction.guild!.id);

    if (!connection) {
      return interaction.reply({
        content: "The bot is not in a voice channel!",
        ephemeral: true,
      });
    }

    if (!isInSameVoiceChannelAsBot(interaction)) {
      return interaction.reply({
        content:
          "You need to be in the same voice channel as the bot to stop the music!",
      });
    }

    await interaction.deferReply();

    queue.length = 0;
    setCurrentSong(null);
    audioPlayer.stop();

    connection.destroy();

    await interaction.editReply("Stopped the music and cleared the queue.");

    logAction(
      interaction.client,
      "Stop",
      `${interaction.user.tag} stopped the music and cleared the queue.`,
      interaction.user,
      ""
    );
  },
};

export default stopCommand;
