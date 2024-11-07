import play from "play-dl";

const MAX_DURATION_SECONDS = 60 * 10;

export async function isValidVideo(url: string): Promise<boolean> {
    const songInfo = await play.video_info(url);
    const durationInSeconds = songInfo.video_details.durationInSec;

    return durationInSeconds <= MAX_DURATION_SECONDS;
}
  