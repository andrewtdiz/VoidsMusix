import { SlashCommandBuilder, CommandInteraction, CacheType } from 'discord.js';
import { audioPlayer, queue, playNextSong, setCurrentSong, connection, client } from '../index';
import { logAction } from '../utils/logAction';
import { getConnection } from '../utils/voiceChannelCheck';

const skipCommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the currently playing song'),

  async execute(interaction: CommandInteraction<CacheType>) {
    if (!getConnection(interaction)) {
      return interaction.reply("You need to be in the same voice channel as the bot to use this command!");
    }

    if (!connection) {
      setCurrentSong(null);
      return interaction.reply('No active voice connection.');
    }

    if (queue.length === 0) {
      audioPlayer.stop();
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
