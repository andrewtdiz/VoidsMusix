import { SlashCommandBuilder, CommandInteraction, CacheType } from 'discord.js';
import { audioPlayer, queue, playNextSong, setCurrentSong, connection, client } from '../index';
import { logAction } from '../utils/logAction';
import { isInSameVoiceChannelAsBot } from '../utils/isInSameVoiceChannelAsBot';

const skipCommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the currently playing song'),

  async execute(interaction: CommandInteraction<CacheType>) {
    if (!connection) {
      setCurrentSong(null);
      return interaction.reply('No active voice connection.');
    }
    
    if (!isInSameVoiceChannelAsBot(interaction)) {
      return interaction.reply({
        content:
          "You need to be in the same voice channel as the bot to stop the music!",
      });
    }

    if (queue.length === 0) {
      audioPlayer.stop();
      connection.destroy();
      logAction(client, 'Skip', 'No song to play next', interaction.user, 'N/A');
      return interaction.reply('Skipped the current song');
    }

    audioPlayer.stop();

    if (queue.length > 0) {
      playNextSong(connection);
      const nextSong = queue[0];

      if (nextSong) {
        logAction(client, 'Skip', `Skipped to ${nextSong.title}`, interaction.user, nextSong.url);
        return interaction.reply(`Skipped the current song. Now playing **${nextSong.title}**.`);
      }
    }

    setCurrentSong(null);
    logAction(client, 'Skip', 'Skipped current song', interaction.user, 'N/A');
    return interaction.reply('Skipped the current song');
  },
};

export default skipCommand;
