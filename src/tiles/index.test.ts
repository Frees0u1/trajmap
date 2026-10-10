import { TileService } from './index';

const coord = { x: 51717, y: 32510, z: 16 };

describe('TileService.getTileUrl', () => {
  const originalEnv = process.env.CARTO_API_KEY;

  beforeEach(() => {
    delete process.env.CARTO_API_KEY;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalEnv === undefined) delete process.env.CARTO_API_KEY;
    else process.env.CARTO_API_KEY = originalEnv;
  });

  it('builds a CARTO Voyager URL with retina suffix', () => {
    const url = TileService.getTileUrl(coord, true);
    expect(url).toMatch(
      /^https:\/\/[abcd]\.basemaps\.cartocdn\.com\/rastertiles\/voyager\/16\/51717\/32510@2x\.png$/
    );
  });

  it('appends the API key from options', () => {
    const url = TileService.getTileUrl(coord, false, { apiKey: 'a b&c' });
    expect(url).toMatch(/\/16\/51717\/32510\.png\?key=a%20b%26c$/);
  });

  it('falls back to the CARTO_API_KEY environment variable', () => {
    process.env.CARTO_API_KEY = 'env-key';
    expect(TileService.getTileUrl(coord)).toMatch(/\?key=env-key$/);
  });

  it('prefers the options key over the environment variable', () => {
    process.env.CARTO_API_KEY = 'env-key';
    expect(TileService.getTileUrl(coord, false, { apiKey: 'opt-key' })).toMatch(/\?key=opt-key$/);
  });

  it('fills placeholders in a custom URL template without appending the key', () => {
    const url = TileService.getTileUrl(coord, true, {
      apiKey: 'k',
      urlTemplate: 'https://tiles.example.com/{z}/{x}/{y}{r}.png?token={key}',
    });
    expect(url).toBe('https://tiles.example.com/16/51717/32510@2x.png?token=k');
  });
});
