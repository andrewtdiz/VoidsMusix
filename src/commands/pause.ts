import { audioPlayer, currentSong, playbackStartTime } from "../index";
import { AudioPlayerStatus } from "@discordjs/voice";
import { safeGetVideoDetails } from "../utils/youtube";

export default {
  name: "pause",

  async execute(data: Record<string, any>) {
    if (audioPlayer.state.status === AudioPlayerStatus.Playing && currentSong) {
      audioPlayer.pause();

      const durationInSeconds =
        currentSong.durationInSeconds ??
        (await safeGetVideoDetails(currentSong.url)).durationInSeconds ??
        null;

      const startedAt = playbackStartTime;
      if (durationInSeconds == null || !startedAt) {
        return "Paused the current song.";
      }

      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remainingTime = durationInSeconds - elapsed;
      const remainingFormatted = new Date(remainingTime * 1000)
        .toISOString()
        .substr(11, 8);

      return `Paused the current song. Time left: ${remainingFormatted}`;
    } else {
      return "No song is currently playing.";
    }
  },
};
