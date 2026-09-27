import type { Document, Timeline } from '@/shared/types';

/**
 * Конвертирует `doc.file_path` в публичный URL.
 * В БД путь хранится как `/var/lib/.../uploads/xxx.pdf` или с обратными слэшами — берём basename.
 * Порт of vanilla `documents.js:13` (getFileUrl).
 */
export function docFileUrl(doc: Document): string | null {
  if (!doc.file_path) return null;
  const parts = doc.file_path.split(/[/\\]/);
  const name = parts[parts.length - 1];
  if (!name) return null;
  return `/uploads/${name}`;
}

export function isImage(doc: Document): boolean {
  return !!doc.mime_type && doc.mime_type.startsWith('image/');
}

export function isPdf(doc: Document): boolean {
  return !!doc.mime_type && doc.mime_type.includes('pdf');
}

export const CATEGORY_LABELS: Record<string, string> = {
  visit: 'Visit',
  test: 'Examination',
  diagnosis: 'Diagnosis',
  milestone: 'Event',
};

export const DOC_CATEGORY_LABELS: Record<string, string> = {
  lab: 'Lab Results',
  imaging: 'Images',
  prescription: 'Prescription',
  report: 'Report',
  other: 'Other',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseEventDate(dateStr: string | null | undefined): { day: number; month: string; year: number } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: MONTHS[d.getMonth()] ?? '',
    year: d.getFullYear(),
  };
}

export function getSpecialistInfo(t: Timeline): { name: string | null; type: string | null } {
  const name = t.specialist_name_resolved ?? t.specialist_name;
  const type = t.specialist_specialty ?? t.specialist_type;
  return { name, type };
}

/**
 * Filterы списка в Documents (порт of vanilla documents.js:897).
 */
export type DocumentsFilter = 'all' | 'visits' | 'docs';

/**
 * Условие "это вofит/приём" — совпадает с vanilla:
 * `isVisit = i.category === 'visit' || i.specialist_id || i.specialist_name || i.specialist_type`
 *
 * Important: milestone-события с привязанным специалистом (e.g. "Рождение —
 * выписной эпикрof" → Перевозникова Л.В., неонатолог) ТОЖЕ считаются вofитами
 * и показываются в фильтре «Visitы». Раньше в React я проверял только
 * `category === 'visit' || null`, и такие события пропадали при фильтрации.
 */
function isVisitLike(t: Timeline): boolean {
  if (t.category === 'visit' || t.category === null) return true;
  if (t.specialist_id != null) return true;
  if (t.specialist_name != null && t.specialist_name !== '') return true;
  if (t.specialist_type != null && t.specialist_type !== '') return true;
  return false;
}

export function filterTimeline(items: Timeline[], filter: DocumentsFilter): Timeline[] {
  if (filter === 'all') return items;
  if (filter === 'visits') return items.filter(isVisitLike);
  // 'docs' — только те, у кого есть документы
  return items.filter((t) => (t.documents?.length ?? 0) > 0);
}

/**
 * Group таймлайна по yearsм for рендера секций.
 */
export function groupByYear(items: Timeline[]): Array<{ year: number; items: Timeline[] }> {
  const groups = new Map<number, Timeline[]>();
  for (const item of items) {
    const year = new Date(item.event_date).getFullYear();
    const list = groups.get(year) ?? [];
    list.push(item);
    groups.set(year, list);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
}

// ─── Unified timeline + standalone docs for фильтра «All» ──────────
//
// Проблема которая решается: раньше standalone documents рендерились
// отдельной секцией "Documents без привязки" внofу списка, независимо
// от дат. В результате свежий документ (e.g. аналofы от 10.04.2026)
// оказывался ВНИЗУ, хотя хронологически он самый недавний.
//
// Решение: объединить timeline visits и standalone docs в единый
// список, отсортированный по дате DESC, затем группировать по yearsм.

export type UnifiedEntry =
  | { kind: 'visit'; visit: Timeline; sortDate: string }
  | { kind: 'doc'; doc: Document; sortDate: string };

/**
 * Возвращает дату for сортировки документа.
 * Предпочитаем document_date (дата СОБЫТИЯ — когда сдали аналof, когда
 * выписал врач), fallback на created_at (дата загрузки в систему).
 */
function getDocSortDate(doc: Document): string {
  if (doc.document_date) return doc.document_date;
  if (doc.created_at) return doc.created_at.slice(0, 10);
  return '1970-01-01';
}

export function buildUnifiedEntries(
  visits: Timeline[],
  standaloneDocs: Document[]
): UnifiedEntry[] {
  const entries: UnifiedEntry[] = [
    ...visits.map((v): UnifiedEntry => ({
      kind: 'visit',
      visit: v,
      sortDate: v.event_date || '1970-01-01',
    })),
    ...standaloneDocs.map((d): UnifiedEntry => ({
      kind: 'doc',
      doc: d,
      sortDate: getDocSortDate(d),
    })),
  ];
  // DESC — самое свежее сверху
  entries.sort((a, b) => (a.sortDate < b.sortDate ? 1 : a.sortDate > b.sortDate ? -1 : 0));
  return entries;
}

export function groupEntriesByYear(
  entries: UnifiedEntry[]
): Array<{ year: number; items: UnifiedEntry[] }> {
  const groups = new Map<number, UnifiedEntry[]>();
  for (const entry of entries) {
    const year = new Date(entry.sortDate).getFullYear();
    const list = groups.get(year) ?? [];
    list.push(entry);
    groups.set(year, list);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
}

/**
 * Сортировать и группировать standalone docs по yearsм (for фильтра «Documents»).
 * Использует document_date или created_at fallback.
 */
export function groupDocsByYear(
  docs: Document[]
): Array<{ year: number; items: Document[] }> {
  const sorted = [...docs].sort((a, b) => {
    const da = getDocSortDate(a);
    const db = getDocSortDate(b);
    return da < db ? 1 : da > db ? -1 : 0;
  });
  const groups = new Map<number, Document[]>();
  for (const doc of sorted) {
    const year = new Date(getDocSortDate(doc)).getFullYear();
    const list = groups.get(year) ?? [];
    list.push(doc);
    groups.set(year, list);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
}
