export function formatNumber(value: number, digits: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatDateTime(date: Date): string {
  const two = (value: number) => String(value).padStart(2, '0');
  return (
    `${two(date.getDate())}/${two(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${two(date.getHours())}:${two(date.getMinutes())}`
  );
}
