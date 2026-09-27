/**
 * Textовые утилиты.
 * Порт of vanilla `frontend/js/utils.js`.
 *
 * ВАЖНО: `escapeHtml` of vanilla здесь НЕ нужен — React автоматически
 * экранирует все строки в JSX. Единственное исключение — `dangerouslySetInnerHTML`,
 * которое мы зAprещаем (см. §16 плана).
 */

/**
 * Обрезает текст до N символов, берёт только первую непустую строку,
 * добавляет "..." если обрезано. Используется for превью в списках.
 */
export function truncate(text: string | null | undefined, maxLen: number): string {
  if (!text) return '';
  const firstLine = text.split('\n').find((l) => l.trim()) ?? '';
  return firstLine.length > maxLen ? firstLine.slice(0, maxLen) + '...' : firstLine;
}

/**
 * Первая буква заглавная.
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Плюралofация for русского: "1 day", "2 days", "5 days".
 * n — число, forms — [singular, few, many].
 */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}
