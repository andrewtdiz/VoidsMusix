import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import {
  audioPlayer,
  queue,
  playNextSong,
  setCurrentSong,
  getConnection,
} from "../index";
import JSONStorage from "../utils/storage";

function removeAtIndex<T>(array: T[], index: number): T | null {
  if (index >= 0 && index < array.length) {
    return array.splice(index, 1)[0];
  }
  return null;
}

const removeCommand = {
  name: "remove",

  async execute(data: Record<string, any>) {
    const index = Number(data?.index || -1);

    const connection = getConnection();
    if (!connection) {
      setCurrentSong(null);
      return "No active voice connection.";
    }

    if (queue.length === 0) {
      return "No song in the queue to skip";
    }

    if (typeof index !== "number") {
      return `Invalid index ${index}`;
    }
    if (index > queue.length || index < 0) {
      return `Invalid index ${index}, queue length ${queue.length}`;
    }

    const removedSong = removeAtIndex(queue, index - 1);
    JSONStorage.set("queue", queue);

    if (removedSong) {
      return `Removed the current song at index **${index}**: **${removedSong.title}**.`;
    }
    return `No song at index ${index}`;
  },
};

export default removeCommand;
