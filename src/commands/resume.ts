import {
  audioPlayer,
  currentSong,
  client,
  setConnection,
  queue,
  playNextSong,
} from "../index";
import { AudioPlayerStatus, joinVoiceChannel, getVoiceConnection } from "@discordjs/voice";
import JSONStorage from "../utils/storage";

export default {
  name: "resume",

  async execute(data: Record<string, any>) {
    if (audioPlayer.state.status === AudioPlayerStatus.Paused && currentSong) {
      audioPlayer.unpause();
      return "Resumed the current song.";
    } else if (currentSong) {
      const voiceChannelId = data.voiceChannelId;
      if (!voiceChannelId) {
        return `Could not find the voice channel: ${voiceChannelId}.`;
      }
      const guild = client.guilds.cache.get(data.guildId);
      if (!guild) {
        return `Could not find the guild: ${data.guildId}.`;
      }

      let connection = getVoiceConnection(guild.id);
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: voiceChannelId,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });
      }

      setConnection(connection);

      if (connection && currentSong) {
        queue.unshift(currentSong);
        JSONStorage.set("queue", queue);
        playNextSong(connection);
      }
      return "Resuming music";
    } else {
      return "No song is currently paused.";
    }
  },
};
