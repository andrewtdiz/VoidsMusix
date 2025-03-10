import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import {
  audioPlayer,
  queue,
  playNextSong,
  setCurrentSong,
  destroyConnection,
  getConnection,
} from "../index";
import { logAction } from "../utils/logAction";
import { isInSameVoiceChannelAsBot } from "../utils/isInSameVoiceChannelAsBot";

const skipCommand = {
  name: "skip",

  async execute(data: Record<string, any>) {
    const connection = getConnection();
    if (!connection) {
      setCurrentSong(null);
      return "No active voice connection.";
    }

    if (queue.length === 0) {
      audioPlayer.stop();
      destroyConnection;

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
