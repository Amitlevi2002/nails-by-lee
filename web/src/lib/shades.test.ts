import { describe, expect, it } from 'vitest';
import { SHADES, inkOn, readShadeNote, shadeById, shadeNote } from './shades';

describe('shade notes', () => {
  it('round-trips the shade and her own words', () => {
    const red = shadeById('red');
    const note = shadeNote(red, '  פעם ראשונה ');
    expect(note).toBe('גוון: אדום קלאסי · פעם ראשונה');
    expect(readShadeNote(note)).toEqual({ shade: red, rest: 'פעם ראשונה' });
  });

  it('leaves notes without a shade alone', () => {
    expect(readShadeNote('ימים א׳-ג׳ אחרי 16:00')).toEqual({ shade: null, rest: 'ימים א׳-ג׳ אחרי 16:00' });
    expect(readShadeNote('גוון: סגול זוהר')).toEqual({ shade: null, rest: 'גוון: סגול זוהר' });
  });

  it('falls back to the first shade for unknown ids', () => {
    expect(shadeById('nope')).toBe(SHADES[0]);
    expect(shadeById(null)).toBe(SHADES[0]);
  });

  it('puts dark text on light polish and white text on dark polish', () => {
    expect(inkOn(shadeById('milk').hex)).toBe('#1d1418');
    expect(inkOn(shadeById('cherry').hex)).toBe('#ffffff');
  });
});
