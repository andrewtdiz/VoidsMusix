import { SlashCommandBuilder, CommandInteraction, CacheType } from "discord.js";
import {
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnection,
} from "@discordjs/voice";
import { queue, playNextSong, audioPlayer, setConnection } from "../index";
import play from "play-dl";
import { logAction } from "../utils/logAction";
import { isInSameVoiceChannelAsBot } from "../utils/isInSameVoiceChannelAsBot";
import { isValidUrl } from "../utils/isValidUrl";
import { isValidVideo } from "../utils/isValidVideo";

const MAX_LIST_SONGS = 5;

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${
    remainingSeconds < 10 ? "0" : ""
  }${remainingSeconds} minutes`;
}

function getConnection(
  interaction: CommandInteraction<CacheType>
): VoiceConnection | null {
  const member = interaction.member;
  const guild = interaction.guild;

  if (!member || !("voice" in member) || !member.voice.channel || !guild) {
    return null;
  }

  return joinVoiceChannel({
    channelId: member.voice.channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });
}

const playCommand = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Search for a song on YouTube and play it")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("The search query to find the song")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("index")
        .setDescription("If playlist, the index to start at")
        .setRequired(false)
    ),

  async execute(interaction: CommandInteraction<CacheType>) {
    try {
      await interaction.deferReply();

      const query = interaction.options.get("query")?.value as string;
      const indexString = interaction.options.get("index")?.value as string;
      const index = Number(indexString) || 0;

      if (!isInSameVoiceChannelAsBot(interaction)) {
        return interaction.editReply(
          "You need to be in the same voice channel as the bot to play music!"
        );
      }

      const connection = getConnection(interaction);

      if (!connection) {
        return interaction.editReply(
          "You need to be in a voice channel to play music!"
        );
      }

      const isValidURL = isValidUrl(query);
      let playListId: string | null = null;

      try {
        const parsedUrl = new URL(query);
        playListId = parsedUrl?.searchParams?.get("list");
      } catch {}

      let video = null;

      if (isValidURL && playListId) {
        console.log(`Playlist found: ${playListId}`);

        const playlist = await play.playlist_info(playListId, {
          incomplete: true,
        });
        const videos = await playlist.all_videos();

        let addedCount = 0;

        const start = index;
        const end = Math.min(start + 5, videos.length - 1);

        const promises = videos.slice(start, end).map(async (vid, index) => {
          if (addedCount >= MAX_LIST_SONGS) return null; // Return null for skipped items

          if (await isValidVideo(vid.url)) {
            console.log(`Valid song found ${vid.title}`);
            const song = {
              title: vid.title || "Unknown Title",
              url: vid.url,
            };

            if (addedCount === 0) {
              video = vid;
            }

            addedCount++;
            return { song, index };
          }
          return null;
        });

        const results = await Promise.all(promises);
        const songResults = results.filter((value) => value !== null);

        songResults
          .sort((a, b) => a.index - b.index)
          .forEach(({ song }) => queue.push(song));

        for (const vid of videos) {
          console.log(`Found song at ${vid}`);

          if (addedCount >= MAX_LIST_SONGS) break;

          if (await isValidVideo(vid.url)) {
            const song = {
              title: vid.title || "Unknown Title",
              url: vid.url,
            };

            if (addedCount === 0) {
              video = vid;
            }

            queue.push(song);
            addedCount++;
          }
        }
      } else {
        const searchResult = await play.search(query, { limit: 1 });
        video = searchResult[0];

        if (!video) {
          return interaction.editReply("No results found for your query.");
        }
      }

      if (!video) {
        await interaction.editReply(`No valid song added to the queue!`);
        return;
      }

      setConnection(connection);

      const song = {
        title: video.title || "Unknown Title",
        url: video.url,
      };
      const songInfo = await play.video_info(video.url);
      const durationInSeconds = songInfo.video_details.durationInSec;
      const durationFormatted = formatTime(durationInSeconds);

      queue.push(song);
      await interaction.editReply(
        `Added **${song.title}** to the queue! Duration: ${durationFormatted}`
      );

      logAction(
        interaction.client,
        "Play",
        `Added ${song.title} to the queue.`,
        interaction.user,
        song.url
      );

      if (audioPlayer.state.status !== AudioPlayerStatus.Playing) {
        playNextSong(connection);
      }
    } catch (error) {
      console.error("Error handling play command:", error);
      try {
        if (interaction.deferred) {
          await interaction.editReply(
            "There was an error trying to execute this command!"
          );
        } else {
          await interaction.reply(
            "There was an error trying to execute this command!"
          );
        }
      } catch (replyError) {
        console.error("Error sending reply:", replyError);
      }
    }
  },
};

export default playCommand;
