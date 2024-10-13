import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { audioPlayer, currentSong, client } from '../index';
import { AudioPlayerStatus } from '@discordjs/voice';
import { logAction } from '../utils/logAction';

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),
  async execute(interaction: CommandInteraction) {
    if (audioPlayer.state.status === AudioPlayerStatus.Paused && currentSong) {
      audioPlayer.unpause();
      await interaction.reply('Resumed the current song.');

      logAction(client, 'Resume', 'Resumed the song', interaction.user, currentSong.url);
    } else {
      await interaction.reply('No song is currently paused.');
    }
  },
};