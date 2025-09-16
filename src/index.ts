import { Client, GatewayIntentBits, Interaction } from "discord.js";
import express, { Express, Request, Response } from "express";
import {
  createAudioPlayer,
  AudioPlayerStatus,
  createAudioResource,
  AudioPlayer,
  AudioResource,
  StreamType,
  VoiceConnection,
  getVoiceConnection,
} from "@discordjs/voice";
import { config } from "dotenv";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import playCommand from "./commands/play";
import pauseCommand from "./commands/pause";
import resumeCommand from "./commands/resume";
import queueCommand from "./commands/queue";
import stopCommand from "./commands/stop";
import skipCommand from "./commands/skip";
import loopCommand from "./commands/loop";
import removeCommand from "./commands/remove";

import { getLooping } from "./utils/looping";
import { spawn } from "child_process";
import fs from "fs";
import Cache from "./utils/cache";
import JSONStorage from "./utils/storage";
import jumpCommand from "./commands/jump";
import { RateLimiter } from "./utils/rateLimit";

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

config();

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

export interface Song {
  title: string;
  url: string;
  durationInSeconds?: number | null;
}
export let queue: Song[] = JSONStorage.get("queue") || [];
export let currentSong: Song | null = JSONStorage.get("currentSong") || null;
export let audioPlayer: AudioPlayer = createAudioPlayer();
export let connection: VoiceConnection | null = null;
let idleTimeout: NodeJS.Timer | null = null;
export let isStartingPlayback: boolean = false;

export function setCurrentSong(song: Song | null) {
  currentSong = song;
  JSONStorage.set("currentSong", currentSong);
}

export function getConnection() {
  return connection;
}

export function setConnection(newConnection: VoiceConnection) {
  if (connection && connection !== newConnection) {
    connection.destroy();
  }
  connection = newConnection;
}

export function destroyConnection() {
  if (connection === null) return;

  connection.destroy();
  connection = null;
}

const commands = [
  playCommand,
  pauseCommand,
  jumpCommand,
  loopCommand,
  removeCommand,
  resumeCommand,
  queueCommand,
  stopCommand,
  skipCommand,
];

app.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.command) return;

    const { command: commandName } = data;

    let result = null;
    for (const command of commands) {
      if (command.name === commandName) {
        result = await command.execute(data);
        break;
      }
    }

    res.send(JSON.stringify({ result }));
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).send("Internal server error");
  }
});

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_TOKEN as string
);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID as string),
      { body: [] }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.login(process.env.DISCORD_TOKEN);

client.once("ready", (client) => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

export let playbackStartTime: number | null = null;

function leaveVoiceChannelAfterTimeout() {
  //@ts-ignore
  if (idleTimeout) clearTimeout(idleTimeout);

  idleTimeout = setTimeout(() => {
    if (connection) {
      destroyConnection();
    }
  }, 300 * 1000);
}

export async function playNextSong(connection: VoiceConnection) {
  if (queue.length === 0) {
    setCurrentSong(null);
    leaveVoiceChannelAfterTimeout();
    isStartingPlayback = false;
    return;
  }

  const song = queue.shift()!;
  JSONStorage.set("queue", queue);
  setCurrentSong(song);

  isStartingPlayback = true;

  const local = Cache.findLocalForUrl(song.url);
  let resource: AudioResource;
  if (local) {
    const { audioPath } = local;
    try {
      resource = createAudioResource(fs.createReadStream(audioPath), {
        inputType: StreamType.Arbitrary,
      });
    } catch (error) {
      console.error("Failed to create audio resource from local file:", error);
      // do not fallback to yt-dlp for local playback; skip to next track
      isStartingPlayback = false;
      playNextSong(connection);
      return;
    }
  } else {
    const child = spawn("yt-dlp", [
      "-o",
      "-",
      "-f",
      "bestaudio",
      "--quiet",
      "--no-warnings",
      song.url,
    ]);
    child.on("error", (error) => {
      console.error(`Error spawning yt-dlp: ${error.message}`);
      isStartingPlayback = false;
      playNextSong(connection);
    });
    // capture stdout in-memory while streaming to Discord
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    child.stdout.on("data", (chunk: Buffer) => {
      const view = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      chunks.push(view);
      totalBytes += chunk.length;
    });
    resource = createAudioResource(child.stdout, {
      inputType: StreamType.Arbitrary,
    });
    audioPlayer.play(resource);
    connection.subscribe(audioPlayer);
    playbackStartTime = Date.now();
    isStartingPlayback = false;
    child.on("exit", (code) => {
      if (code !== 0) {
        console.error(`yt-dlp exited with code ${code}. Skipping this song.`);
        playNextSong(connection);
      }
    });
    audioPlayer.once(AudioPlayerStatus.Idle, async () => {
      if (getLooping()) {
        queue.unshift(song);
        JSONStorage.set("queue", queue);
      }
      try {
        const { audioPath } = Cache.getPathsForUrl(song.url);
        if (!fs.existsSync(audioPath)) {
          const combined = Buffer.concat(chunks, totalBytes);
          const u8 = new Uint8Array(combined.buffer, combined.byteOffset, combined.byteLength);
          await fs.promises.writeFile(audioPath, u8);
          console.log(`[Cache] Wrote streamed audio to`, { audioPath, totalBytes });
        }
      } catch (e) {
        console.error("Failed to persist streamed audio buffer:", e);
      }
      playNextSong(connection);
    });
    audioPlayer.on("error", (error) => {
      console.error("Audio player error:", error);
      playNextSong(connection);
    });
    //@ts-ignore
    if (idleTimeout) clearTimeout(idleTimeout);
    return;
  }

  // If we are here and useLocal is true and no exception occurred
  audioPlayer.play(resource);
  connection.subscribe(audioPlayer);
  playbackStartTime = Date.now();
  isStartingPlayback = false;

  audioPlayer.once(AudioPlayerStatus.Idle, () => {
    if (getLooping()) {
      queue.unshift(song);
      JSONStorage.set("queue", queue);
    }
    playNextSong(connection);
  });

  audioPlayer.on("error", (error) => {
    console.error("Audio player error:", error);
    playNextSong(connection);
  });

  //@ts-ignore
  if (idleTimeout) clearTimeout(idleTimeout);
}

process.on("SIGINT", () => {
  connection?.destroy();
  process.exit();
});

process.on("SIGTERM", () => {
  connection?.destroy();
  process.exit();
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// Clean up rate limiter entries every 5 minutes to prevent memory leaks
setInterval(() => {
  RateLimiter.cleanup();
}, 5 * 60 * 1000);
