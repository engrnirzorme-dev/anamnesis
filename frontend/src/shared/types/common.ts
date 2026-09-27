/**
 * Общие типы, используемые в нескольких сущностях.
 *
 * Source правды — читать схему of `backend/src/db.js`.
 */

export type ISODateString = string;

export type Severity = 'critical' | 'warning' | 'info';

export type EntityStatus = 'active' | 'resolved' | 'suspected' | 'completed' | 'stopped';

/** Priority for плана/ошибок */
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
