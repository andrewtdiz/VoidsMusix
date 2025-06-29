import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import {
  audioPlayer,
  queue,
  playNextSong,
  setCurrentSong,
  destroyConnection,
  getConnection,
  currentSong,
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

    // Capture the current song name before skipping
    const currentSongName = currentSong ? currentSong.title : null;
    const currentSongMessage = currentSongName ? `**${currentSongName}**` : "the current song";

    if (queue.length === 0) {
      audioPlayer.stop();
      destroyConnection();

      return `Skipped ${currentSongMessage}`;
    }

    audioPlayer.stop();

    if (queue.length > 0) {
      playNextSong(connection);
      const nextSong = queue[0];

      if (nextSong) {
        return `Skipped ${currentSongMessage}. Now playing **${nextSong.title}**.`;
      }
    }

    setCurrentSong(null);

    return `Skipped ${currentSongMessage}`;
  },
};

export default skipCommand;
