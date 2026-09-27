/**
 * Formтирование дат и возраста.
 * Порт of vanilla `frontend/js/utils.js`.
 */

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU');
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Age с учётом months for детей младше 2 years.
 * Примеры: "5 months", "18 months", "3 г.", "12 г."
 */
export function calcAge(dob: string | Date | null | undefined): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
  if (years < 2) {
    let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) months--;
    return `${months} months`;
  }
  return `${years} г.`;
}

/**
 * ISO-дата без времени в локальной таймзоне (for <input type="date">).
 */
export function toDateInput(d: string | Date | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Относительное время ("today", "yesterday", "3 days ago") for списков.
 */
export function relativeDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(d);
}
