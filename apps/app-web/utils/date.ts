const numberFormatter = new Intl.NumberFormat();

export function formatCount(value: number) {
  return numberFormatter.format(value);
}
