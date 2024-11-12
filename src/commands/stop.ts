import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { queue, audioPlayer, setCurrentSong, connection } from "../index";
import { logAction } from "../utils/logAction";
import { isInSameVoiceChannelAsBot } from "../utils/isInSameVoiceChannelAsBot";

const stopCommand = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop the music and clear the queue"),

  async execute(data: Record<string, any>) {
    queue.length = 0;
    setCurrentSong(null);
    audioPlayer.stop();

    connection?.destroy();

    return "Stopped the music and cleared the queue.";
  },
};

export default stopCommand;
