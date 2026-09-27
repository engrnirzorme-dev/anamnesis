import {
  IconRuler2,
  IconScale,
  IconBabyCarriage,
  IconAlertCircle,
} from '@tabler/icons-react';
import { formatDate, calcAge } from '@/shared/lib/date';
import type { Patient } from '@/shared/types';

/**
 * Card patientа на Dashboard. Порт of vanilla `dashboard.js:210-235`.
 * Использует класс `.patient-card` of app.css.
 */
export function PatientCard({ patient }: { patient: Patient | null }) {
  if (!patient) return null;
  const age = calcAge(patient.date_of_birth);

  return (
    <div className="patient-card">
      <div className="patient-name">{patient.full_name ?? 'Patient'}</div>
      <div className="patient-info">
        {patient.date_of_birth && formatDate(patient.date_of_birth)}
        {age && ` (${age})`}
        {patient.gender && ` / ${patient.gender}`}
        {patient.city && ` / ${patient.city}`}
      </div>
      <div className="patient-meta">
        {patient.current_height_cm != null && (
          <span>
            <IconRuler2 size={14} style={{ marginRight: 4 }} />
            {patient.current_height_cm} cm
          </span>
        )}
        {patient.current_weight_kg != null && (
          <span>
            <IconScale size={14} style={{ marginRight: 4 }} />
            {patient.current_weight_kg} kg
          </span>
        )}
        {patient.birth_weight_g != null && (
          <span>
            <IconBabyCarriage size={14} style={{ marginRight: 4 }} />
            {patient.birth_weight_g} g
          </span>
        )}
      </div>
      {patient.allergies && (
        <div className="patient-meta" style={{ marginTop: 8 }}>
          <span>
            <IconAlertCircle size={14} style={{ marginRight: 4 }} />
            Allergies: {patient.allergies}
          </span>
        </div>
      )}
    </div>
  );
}
