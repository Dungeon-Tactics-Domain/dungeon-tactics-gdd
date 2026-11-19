import { describe, expect, it } from 'vitest';
import { barAt, barCount, barSeconds, filterSongs, formatTime, pitchRanges, rulerBars, timeToX, xToTime } from './math';
import type { Song } from './schema';

const song = (id: string, title: string, category: string, authorship = 'Dungeon Tactics'): Song => ({
  id,
  title,
  category,
  authorship,
  channels: [{ channel: 0, program: 42, name: 'Cello' }],
  versions: [{ id: 'gugs', label: 'GeneralUser GS', stemsBase: `/s/${id}`, midi: `/m/${id}.mid`, duration: 94.5 }],
  references: [],
  measurements: [],
  checks: [],
});
const songs = [
  song('march', 'Marcha das Cinzas', 'battle'),
  song('bread', 'Pão e Lareira', 'town', 'tema B'),
  song('embers', 'Brasas', 'battle'),
];

describe('roll maths', () => {
  it('counts bars from the tempo, as measured on the lab pieces', () => {
    expect(barSeconds(120)).toBe(2);
    expect(barCount(94.545442, 132)).toBe(52); // Marcha das Cinzas: 52 bars by its score
    expect(barCount(126.315782, 76)).toBe(40); // Pão e Lareira: 40 bars by its score
    expect(barAt(0, 132, 52)).toBe(1);
    expect(barAt(1.82, 132, 52)).toBe(2);
    expect(barAt(94.5, 132, 52)).toBe(52); // the reverb tail never makes a bar 53
  });

  it('maps time to x and back, clamped to the song', () => {
    expect(timeToX(25, 100, 800)).toBe(200);
    expect(xToTime(200, 100, 800)).toBe(25);
    expect(xToTime(-5, 100, 800)).toBe(0);
    expect(xToTime(900, 100, 800)).toBe(100);
    expect(timeToX(10, 0, 800)).toBe(0);
  });

  it('spaces ruler labels so they never touch', () => {
    expect(rulerBars(52, 1040)).toEqual([1, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52]); // 20 px a bar
    expect(rulerBars(8, 800)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('formats m:ss and finds each channel pitch range', () => {
    expect(formatTime(94.5)).toBe('1:34');
    expect(formatTime(-1)).toBe('0:00');
    const ranges = pitchRanges([
      { channel: 0, pitch: 50 },
      { channel: 0, pitch: 62 },
      { channel: 9, pitch: 36 },
    ]);
    expect([...ranges]).toEqual([
      [0, [50, 62]],
      [9, [36, 36]],
    ]);
  });

  it('filters by category and by title or authorship, ignoring case and accents', () => {
    expect(filterSongs(songs, 'battle', '').map((s) => s.id)).toEqual(['march', 'embers']);
    expect(filterSongs(songs, 'battle', 'cinzas').map((s) => s.id)).toEqual(['march']);
    expect(filterSongs(songs, 'town', 'PAO').map((s) => s.id)).toEqual(['bread']);
    expect(filterSongs(songs, 'town', 'tema b').map((s) => s.id)).toEqual(['bread']);
    expect(filterSongs(songs, 'menu', '')).toEqual([]);
  });
});
