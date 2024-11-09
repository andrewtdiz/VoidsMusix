import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  Role,
  GuildMember,
  PermissionsBitField,
} from "discord.js";

let djMode = false;
let djRole: Role | null = null;

const djmodeCommand = {
  data: new SlashCommandBuilder()
    .setName("djmode")
    .setDescription("Toggle DJ Mode on or off and set the DJ role")
    .addBooleanOption((option) =>
      option
        .setName("status")
        .setDescription("Turn DJ Mode on or off")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option.setName("role").setDescription("The DJ role").setRequired(true)
    ),

  async execute(interaction: CommandInteraction<CacheType>) {
    if (
      !interaction.memberPermissions?.has(PermissionsBitField.Flags.BanMembers)
    ) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const status = interaction.options.get("status")?.value as boolean;
    const role = interaction.options.get("role")?.role as Role;

    if (!role || !interaction.guild) {
      return interaction.reply("You need to provide a valid role.");
    }

    djMode = status;
    djRole = role;

    return interaction.reply(
      `DJ Mode is now ${djMode ? "enabled" : "disabled"} with the role ${
        djRole.name
      }`
    );
  },

  checkDJ(interaction: CommandInteraction): boolean {
    if (!djMode) return true;

    const member = interaction.member as GuildMember;
    if (!member || !member.roles) return false;

    const memberRoles = member.roles;
    return "cache" in memberRoles && memberRoles.cache.has(djRole?.id || "");
  },
};

export { djmodeCommand, djMode, djRole };
