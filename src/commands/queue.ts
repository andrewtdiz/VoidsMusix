import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import { queue, currentSong, playbackStartTime } from "../index";
import play from "play-dl";
import { getLooping } from "../utils/looping";

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

const queueCommand = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Shows the current song and the queue of upcoming songs"),

  async execute(data: Record<string, any>) {
    if (!currentSong && queue.length === 0) {
      return "Nothing is currently playing and the queue is empty.";
    }

    const updateMessage = async () => {
      let remainingTimeMessage = "";

      if (currentSong && playbackStartTime) {
        const songInfo = await play.video_info(currentSong.url);
        const durationInSeconds = songInfo.video_details.durationInSec;
        const elapsedTime = Math.floor((Date.now() - playbackStartTime) / 1000);
        const remainingTime = durationInSeconds - elapsedTime;

        if (remainingTime > 0) {
          remainingTimeMessage = `Time left for the current song: **${formatTime(
            remainingTime
          )}**\n\n`;
        }
      }

      const currentSongMessage = currentSong
        ? `Currently playing: **${currentSong.title}**${
            getLooping() ? " (looping)" : ""
          }\n`
        : "Nothing is currently playing.\n";

      const queueMessage =
        queue.length > 0
          ? `Upcoming queue:\n${queue
              .map((song, index) => `${index + 1}. **${song.title}**`)
              .join("\n")}`
          : "The queue is empty.";

      return remainingTimeMessage + currentSongMessage + queueMessage;
    };

    return updateMessage();
  },
};

export default queueCommand;
