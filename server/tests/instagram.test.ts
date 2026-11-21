import {
  extractInstagramUrl,
  normalizeVideoEntry,
  parseInstagramUrl,
} from '../src/utils/instagram';

describe('Instagram URL parser', () => {
  it('parses reel URLs and normalises the query string away', () => {
    const parsed = parseInstagramUrl('https://www.instagram.com/reel/CABC123xyz/?igsh=abc123');
    expect(parsed).toEqual({
      provider: 'instagram',
      sourceUrl: 'https://www.instagram.com/reel/CABC123xyz/',
      shortcode: 'CABC123xyz',
      mediaType: 'reel',
      embedUrl: 'https://www.instagram.com/reel/CABC123xyz/embed/',
      aspectRatio: '9:16',
    });
  });

  it('treats /reels/ as a reel', () => {
    const parsed = parseInstagramUrl('https://instagram.com/reels/CReel12345/');
    expect(parsed?.mediaType).toBe('reel');
    expect(parsed?.embedUrl).toBe('https://www.instagram.com/reel/CReel12345/embed/');
  });

  it('parses posts and TV links', () => {
    expect(parseInstagramUrl('https://www.instagram.com/p/CPost12345/')).toMatchObject({
      mediaType: 'post',
      aspectRatio: '1:1',
      embedUrl: 'https://www.instagram.com/p/CPost12345/embed/',
    });
    expect(parseInstagramUrl('https://www.instagram.com/tv/CTv123456/')).toMatchObject({
      mediaType: 'tv',
      aspectRatio: '9:16',
      embedUrl: 'https://www.instagram.com/tv/CTv123456/embed/',
    });
  });

  it('extracts a URL from share text', () => {
    const input = 'Look at this fit https://www.instagram.com/reel/CShare1234/?igsh=zzz amazing';
    expect(extractInstagramUrl(input)).toBe('https://www.instagram.com/reel/CShare1234');
    expect(parseInstagramUrl(input)?.shortcode).toBe('CShare1234');
  });

  it('rejects non-Instagram and malformed links', () => {
    expect(parseInstagramUrl('https://youtube.com/shorts/abc')).toBeNull();
    expect(parseInstagramUrl('https://www.instagram.com/explore/tags/oversized/')).toBeNull();
    expect(parseInstagramUrl('not a url')).toBeNull();
    expect(parseInstagramUrl(null)).toBeNull();
  });

  it('keeps legacy uploaded videos working', () => {
    const video = normalizeVideoEntry({ url: 'https://cdn.example.com/pdp.mp4' });
    expect(video.provider).toBe('upload');
    expect(video.mediaType).toBe('file');
    expect(video.aspectRatio).toBe('16:9');
  });

  it('enriches Instagram video entries', () => {
    const video = normalizeVideoEntry({ url: 'https://www.instagram.com/reel/CVideo1234/' });
    expect(video).toMatchObject({
      provider: 'instagram',
      shortcode: 'CVideo1234',
      embedUrl: 'https://www.instagram.com/reel/CVideo1234/embed/',
      mediaType: 'reel',
      enabled: true,
    });
  });
});
