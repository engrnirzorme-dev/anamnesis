import type { ISODateString } from './common';

/**
 * Status результата аналofа — совпадает с vanilla.
 * - normal: в пределах нормы
 * - low: ниже нормы
 * - high: выше нормы
 * - critical: критическое отклонение
 */
export type LabResultStatus = 'normal' | 'low' | 'high' | 'critical';

export interface LabResult {
  id: number;
  patient_id: number;
  test_name: string;
  parameter: string;
  /** Value может быть числом или строкой (e.g. "положительно") */
  value: string | number | null;
  unit: string | null;
  /** Mинимум нормы (числовое поле of БД) */
  ref_min: number | null;
  /** Mаксимум нормы (числовое поле of БД) */
  ref_max: number | null;
  status: LabResultStatus | null;
  test_date: ISODateString;
  lab_name: string | null;
  notes: string | null;
  created_at: ISODateString;
}
