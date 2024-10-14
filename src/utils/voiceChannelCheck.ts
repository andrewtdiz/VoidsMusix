import { CommandInteraction, GuildMember } from 'discord.js';
import { getVoiceConnection, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';

export function getConnection(interaction: CommandInteraction): VoiceConnection | null {
  const member = interaction.member as GuildMember;
  const guild = interaction.guild;

  if (!member || !("voice" in member) || !member.voice.channel || !guild) {
    return null;
  }

  const connection = getVoiceConnection(guild.id);

  if (connection) {
    const botChannelId = connection.joinConfig.channelId;
    const userChannelId = member.voice.channel.id;

    if (botChannelId !== userChannelId) {
      return null;
    }

    return connection;
  }

  return joinVoiceChannel({
    channelId: member.voice.channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });
}