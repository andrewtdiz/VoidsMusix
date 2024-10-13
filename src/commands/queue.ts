import { SlashCommandBuilder, CommandInteraction, CacheType } from 'discord.js';
import { queue, currentSong, playbackStartTime } from '../index';
import play from 'play-dl';

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

const queueCommand = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Shows the current song and the queue of upcoming songs'),

  async execute(interaction: CommandInteraction<CacheType>) {
    await interaction.deferReply();

    if (!currentSong && queue.length === 0) {
      return interaction.editReply('Nothing is currently playing and the queue is empty.');
    }

    const updateMessage = async () => {
      let remainingTimeMessage = '';

      if (currentSong && playbackStartTime) {
        const songInfo = await play.video_info(currentSong.url);
        const durationInSeconds = songInfo.video_details.durationInSec;
        const elapsedTime = Math.floor((Date.now() - playbackStartTime) / 1000);
        const remainingTime = durationInSeconds - elapsedTime;

        if (remainingTime > 0) {
          remainingTimeMessage = `Time left for the current song: **${formatTime(remainingTime)}**\n\n`;
        }
      }

      const currentSongMessage = currentSong
        ? `Currently playing: **${currentSong.title}**\n`
        : 'Nothing is currently playing.\n';

      const queueMessage = queue.length > 0
        ? `Upcoming queue:\n${queue.map((song, index) => `${index + 1}. **${song.title}**`).join('\n')}`
        : 'The queue is empty.';

      await interaction.editReply(remainingTimeMessage + currentSongMessage + queueMessage);
    };

    const interval = setInterval(async () => {
      if (!currentSong || !playbackStartTime) {
        clearInterval(interval);
        return;
      }

      await updateMessage();
    }, 1000);

    updateMessage();
  },
};

export default queueCommand;
