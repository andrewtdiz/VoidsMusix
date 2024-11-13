import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import {
  queue,
  audioPlayer,
  setCurrentSong,
  destroyConnection,
} from "../index";
import { logAction } from "../utils/logAction";
import { isInSameVoiceChannelAsBot } from "../utils/isInSameVoiceChannelAsBot";

const stopCommand = {
  name: "stop",

  async execute(data: Record<string, any>) {
    const connection = getVoiceConnection(data.guildId);

    if (!connection) return "No Connection.";

    queue.length = 0;
    setCurrentSong(null);
    audioPlayer.stop();

    destroyConnection();

    return "Stopped the music and cleared the queue.";
  },
};

export default stopCommand;
