declare module 'yt-dlp-exec' {
  interface YtDlpOptions {
    output?: string;
    quiet?: boolean;
    format?: string;
  }

  export default function ytDlp(url: string, options?: YtDlpOptions): Promise<Buffer>;
}
