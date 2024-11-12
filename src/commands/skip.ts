import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import {
  audioPlayer,
  queue,
  playNextSong,
  setCurrentSong,
  connection,
  client,
} from "../index";
import { logAction } from "../utils/logAction";
import { isInSameVoiceChannelAsBot } from "../utils/isInSameVoiceChannelAsBot";

const skipCommand = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the currently playing song"),

  async execute(data: Record<string, any>) {
    if (!connection) {
      setCurrentSong(null);
      return "No active voice connection.";
    }

    if (queue.length === 0) {
      audioPlayer.stop();
      connection.destroy();

      return "Skipped the current song";
    }

    audioPlayer.stop();

    if (queue.length > 0) {
      playNextSong(connection);
      const nextSong = queue[0];

      if (nextSong) {
        return `Skipped the current song. Now playing **${nextSong.title}**.`;
      }
    }

    setCurrentSong(null);

    return "Skipped the current song";
  },
};

export default skipCommand;
