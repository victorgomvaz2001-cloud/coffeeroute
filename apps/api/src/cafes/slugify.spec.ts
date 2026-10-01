import { slugify } from './slugify';

describe('slugify', () => {
  it('strips accents and punctuation', () => {
    expect(slugify('Café Ñandú, Málaga')).toBe('cafe-nandu-malaga');
    expect(slugify('Atlântico Torrefação Lisboa')).toBe('atlantico-torrefacao-lisboa');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('  ¡Hola!  ')).toBe('hola');
  });

  it('caps the length', () => {
    expect(slugify('a'.repeat(200))).toHaveLength(80);
  });
});
