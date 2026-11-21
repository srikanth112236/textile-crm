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

/** Extract the first Instagram Reel/Post/TV URL from a pasted link or share text. */
export function extractInstagramUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const match = input.match(INSTAGRAM_URL_RE);
  return match ? match[0] : null;
}

export function parseInstagramUrl(input: unknown): ParsedInstagramMedia | null {
  const url = extractInstagramUrl(input);
  if (!url) return null;
  const match = url.match(INSTAGRAM_URL_RE);
  if (!match) return null;

  const rawType = match[1].toLowerCase();
  const shortcode = match[2];
  const mediaType: InstagramMediaType = rawType === 'p' ? 'post' : rawType === 'tv' ? 'tv' : 'reel';
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

export function looksLikeInstagram(input: unknown): boolean {
  return typeof input === 'string' && /instagram\.com/i.test(input);
}
