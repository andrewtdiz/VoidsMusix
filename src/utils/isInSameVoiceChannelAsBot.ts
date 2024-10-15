import { getVoiceConnection } from "@discordjs/voice";
import { CommandInteraction } from "discord.js";

export function isInSameVoiceChannelAsBot(
  interaction: CommandInteraction
): boolean {
  const guild = interaction.guild;

  if (!guild) {
    return false;
  }

  const connection = getVoiceConnection(guild.id);

  if (!connection) return true;

  const botChannelId = connection.joinConfig.channelId;
  const userChannelId = interaction.channelId;
  const member = interaction.member;

  if (!botChannelId) return true;

  if (!member || !("voice" in member)) {
    return false;
  }

  const userVoiceState = member.voice;
  if (!userVoiceState.channelId) {
    return false;
  }

  const userVoiceChannelId = userVoiceState.channelId;

  return botChannelId === userChannelId && userVoiceChannelId === userChannelId;
}
