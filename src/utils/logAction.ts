import { Client, TextChannel, EmbedBuilder, User } from 'discord.js';

require('dotenv').config();
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID as string;

export function logAction(client: Client, action: string, details: string, user: User, videoLink?: string) {
  const channel = client.channels.cache.get(LOG_CHANNEL_ID) as TextChannel;

  if (!channel) {
    console.error(`Log channel with ID ${LOG_CHANNEL_ID} not found.`);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('Music Action Log')
    .setColor(0x0099ff)
    .addFields(
      { name: 'Action', value: action, inline: true },
      { name: 'Details', value: details, inline: true },
      { name: 'User', value: `<@${user.id}>`, inline: true },
      ...(videoLink ? [{ name: 'Video Link', value: `[Click here](${videoLink})`, inline: true }] : [])
    )
    .setTimestamp();

  channel.send({ embeds: [embed] });
}
