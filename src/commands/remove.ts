import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import {
  audioPlayer,
  queue,
  playNextSong,
  setCurrentSong,
  getConnection,
} from "../index";

function removeAtIndex<T>(array: T[], index: number): T | null {
  if (index >= 0 && index < array.length) {
    return array.splice(index, 1)[1];
  }
  return null;
}

const removeCommand = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a song from the list"),

  async execute(data: Record<string, any>) {
    const index = data.index;

    const connection = getConnection();
    if (!connection) {
      setCurrentSong(null);
      return "No active voice connection.";
    }

    if (queue.length === 0) {
      return "No song to skip";
    }

    console.log(index, queue.length);

    if (!index || typeof index !== "number") {
      return "Invalid index";
    }
    const luaIndex = index + 1;
    if (luaIndex > queue.length) {
      return "Invalid index";
    }

    if (queue.length > 0) {
      const removedSong = removeAtIndex(queue, luaIndex);

      if (removedSong) {
        return `Removed the current song at index **${index}**: **${removedSong.title}**.`;
      }
    }

    return `No song at index ${index}`;
  },
};

export default removeCommand;
