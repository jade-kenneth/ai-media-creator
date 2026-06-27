import { safeParseFloat } from './safeParseFloat';

test('safeParseFloat', () => {
  expect(safeParseFloat('3.14')).toBe(3.14);
  expect(safeParseFloat('', 0)).toBe(0);
  expect(safeParseFloat(null, 0)).toBe(0);
  expect(safeParseFloat(null)).toBeUndefined();
  expect(safeParseFloat(NaN)).toBeUndefined();
});
