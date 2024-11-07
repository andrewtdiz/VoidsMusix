export function isPlaylist(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    const params: Record<string, string> = {};
    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return true;
  } catch (error) {
    return false;
  }
}
