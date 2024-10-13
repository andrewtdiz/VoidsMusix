import { SlashCommandBuilder, CommandInteraction, CacheType, EmbedBuilder } from 'discord.js';

const pingCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s latency'),

  async execute(interaction: CommandInteraction<CacheType>) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Command Received')
      .addFields(
        { name: 'Latency', value: `${latency}ms`, inline: true },
        { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ content: '', embeds: [embed] });
  },
};

export default pingCommand;
