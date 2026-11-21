export type InstagramMediaType = 'reel' | 'post' | 'tv';

export interface ParsedInstagramMedia {
  provider: 'instagram';
  sourceUrl: string;
  shortcode: string;
  mediaType: InstagramMediaType;
  embedUrl: string;
  aspectRatio: '9:16' | '1:1';
}

const INSTAGRAM_URL_RE =
  /https?:\/\/(?:www\.)?instagram\.com\/(reel|reels|p|tv)\/([A-Za-z0-9_-]{5,})/i;

const PATH_FOR_TYPE: Record<InstagramMediaType, string> = {
  reel: 'reel',
  post: 'p',
  tv: 'tv',
};

/** Extract the first valid Instagram Reel/Post/TV URL from text or a share string. */
export function extractInstagramUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const match = input.match(INSTAGRAM_URL_RE);
  return match ? match[0] : null;
}

/**
 * Parse and normalise an Instagram URL.
 *
 * Accepts:
 *   instagram.com/reel/CODE
 *   instagram.com/reels/CODE?igsh=…
 *   instagram.com/p/CODE
 *   instagram.com/tv/CODE
 *   a share message containing any of the above
 */
export function parseInstagramUrl(input: unknown): ParsedInstagramMedia | null {
  const url = extractInstagramUrl(input);
  if (!url) return null;

  const match = url.match(INSTAGRAM_URL_RE);
  if (!match) return null;

  const rawType = match[1].toLowerCase();
  const shortcode = match[2];
  const mediaType: InstagramMediaType = rawType === 'p'
    ? 'post'
    : rawType === 'tv'
      ? 'tv'
      : 'reel';
  const path = PATH_FOR_TYPE[mediaType];

  return {
    provider: 'instagram',
    sourceUrl: `https://www.instagram.com/${path}/${shortcode}/`,
    shortcode,
    mediaType,
    embedUrl: `https://www.instagram.com/${path}/${shortcode}/embed/`,
    aspectRatio: mediaType === 'post' ? '1:1' : '9:16',
  };
}

export function isInstagramUrl(input: unknown): boolean {
  return Boolean(parseInstagramUrl(input));
}

/**
 * Normalise a product-video / UGC entry.
 * Legacy `{ url }` records remain valid; Instagram URLs gain provider metadata.
 */
export function normalizeVideoEntry<T extends Record<string, any>>(video: T): T & Record<string, any> {
  if (!video || typeof video !== 'object') return video;
  const candidate = video.sourceUrl || video.url || video.permalink || video.mediaUrl;
  const parsed = parseInstagramUrl(candidate);

  if (parsed) {
    return {
      ...video,
      ...parsed,
      url: video.url || parsed.sourceUrl,
      enabled: video.enabled !== false,
    };
  }

  return {
    ...video,
    provider: video.provider || 'upload',
    mediaType: video.mediaType || 'file',
    aspectRatio: video.aspectRatio || '16:9',
  };
}

export function normalizeVideoList<T extends Record<string, any>>(videos: T[] | undefined): T[] {
  if (!Array.isArray(videos)) return [];
  return videos.map((video) => normalizeVideoEntry(video));
}
