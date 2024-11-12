import { client } from "..";

export type ResultString =
  | "djmode"
  | "pause"
  | "play"
  | "queue"
  | "resume"
  | "skip"
  | "stop";

export function readFromBot(content: string): { command: ResultString, userVoiceChannelId: string } | null {
  console.log(content);

  let data = null;
  try {
    data = JSON.parse(content);
  } catch {
    return null;
  }

  console.log(data);

  if (!data.command || !data.botId || !data.userVoiceChannelId) return null;

  if (client.user?.id !== data.botId) return null;

  return { command: data.command, userVoiceChannelId: data.userVoiceChannelId };
}
