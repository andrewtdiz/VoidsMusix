import { SlashCommandBuilder, CommandInteraction, CacheType, GuildMember } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import { queue, audioPlayer, setCurrentSong } from '../index';
import { logAction } from '../utils/logAction';

const stopCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),

  async execute(interaction: CommandInteraction<CacheType>) {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
      return interaction.reply({
        content: 'You need to be in a voice channel to stop the music!',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    queue.length = 0;
    setCurrentSong(null);
    audioPlayer.stop();

    const connection = getVoiceConnection(interaction.guild!.id);
    connection?.disconnect();

    await interaction.editReply('Stopped the music and cleared the queue.');

    logAction(
      interaction.client,
      'Stop',
      `${interaction.user.tag} stopped the music and cleared the queue.`,
      interaction.user,
      ''
    );
  },
};

export default stopCommand;