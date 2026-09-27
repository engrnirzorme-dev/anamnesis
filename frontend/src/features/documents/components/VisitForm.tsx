import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input, Select, Textarea, Button } from '@/shared/ui';
import { qk } from '@/shared/api/keys';
import { fetchSpecialists } from '@/features/more/api';
import type { VisitInput } from '../api';
import type { Timeline } from '@/shared/types';

/**
 * Универсальная форма создания/редактирования вofита.
 * Порт of vanilla `documents.js` showCreateVisitModal / showEditVisitModal.
 *
 * Использует контролируемые useState (без react-hook-form — форма простая,
 * не хочется тащить лишнюю абстракцию).
 */

const SPECIALIST_TYPES = [
  'Neurologist', 'Pediatrician', 'Speech Therapist', 'Psychologist', 'Psychiatrist',
  'Orthopedist', 'ENT', 'Ophthalmologist', 'Dentist', 'Surgeon',
  'Allergist', 'Dermatologist', 'Gastroenterologist', 'Cardiologist',
  'Endocrinologist', 'Urologist', 'Nephrologist', 'Osteopath', 'Rehabilitation Specialist',
  'Other Specialist',
];

interface Props {
  initial?: Timeline | undefined;
  onSubmit: (data: VisitInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  showAiField?: boolean; // только при редактировании
  extraFooter?: React.ReactNode; // кнопка delete в edit modal
}

export function VisitForm({
  initial,
  onSubmit,
  submitting = false,
  submitLabel = 'Save',
  showAiField = false,
  extraFooter,
}: Props) {
  const { data: specialists = [] } = useQuery({
    queryKey: qk.specialists,
    queryFn: fetchSpecialists,
  });

  const today = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(initial?.title ?? '');
  const [eventDate, setEventDate] = useState(
    initial?.event_date ? initial.event_date.split('T')[0] ?? today : today
  );
  const [specialistId, setSpecialistId] = useState(
    initial?.specialist_id != null ? String(initial.specialist_id) : ''
  );
  const [specialistName, setSpecialistName] = useState(initial?.specialist_name ?? '');
  const [specialistType, setSpecialistType] = useState(initial?.specialist_type ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'visit');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [transcription, setTranscription] = useState(initial?.transcription ?? '');
  const [aiAssessment, setAiAssessment] = useState(initial?.ai_assessment ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !eventDate) return;
    await onSubmit({
      title: trimmedTitle,
      event_date: eventDate,
      specialist_id: specialistId ? Number(specialistId) : null,
      specialist_name: specialistName.trim() || null,
      specialist_type: specialistType || null,
      category: category || null,
      description: description.trim() || null,
      transcription: transcription.trim() || null,
      ai_assessment: showAiField ? aiAssessment.trim() || null : (initial?.ai_assessment ?? null),
      notes: notes.trim() || null,
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <Field label="Visit name *">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="E.g.: Neurology appointment"
          required
        />
      </Field>

      <Field label="Date *">
        <Input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
      </Field>

      <Field label="Specialist">
        <Select value={specialistId} onChange={(e) => setSpecialistId(e.target.value)}>
          <option value="">— Select from list —</option>
          {specialists.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name ?? '((no name))'} — {s.specialization ?? ''}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Or manually: doctor name">
        <Input
          value={specialistName}
          onChange={(e) => setSpecialistName(e.target.value)}
          placeholder="Doctor name (if not in list)"
        />
      </Field>

      <Field label="Specialization">
        <Select value={specialistType ?? ''} onChange={(e) => setSpecialistType(e.target.value)}>
          <option value="">— Select —</option>
          {SPECIALIST_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Category">
        <Select value={category ?? 'visit'} onChange={(e) => setCategory(e.target.value)}>
          <option value="visit">Visit</option>
          <option value="test">Examination</option>
          <option value="diagnosis">Diagnosis</option>
          <option value="milestone">Event</option>
        </Select>
      </Field>

      <Field label="Description / Conclusion">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description or doctor's conclusion"
          rows={3}
        />
      </Field>

      <Field label="Transcription (of NotebookLM)">
        <Textarea
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          placeholder="Вставьте сюда расшифровку аудиоrecords приёма..."
          rows={5}
          style={{ fontSize: 13 }}
        />
      </Field>

      {showAiField && (
        <Field label="AI Analysis">
          <Textarea
            value={aiAssessment}
            onChange={(e) => setAiAssessment(e.target.value)}
            rows={4}
            style={{ fontSize: 13 }}
          />
        </Field>
      )}

      <Field label="Notes">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes"
          rows={2}
        />
      </Field>

      <Button type="submit" block loading={submitting} style={{ marginTop: 8 }}>
        {submitLabel}
      </Button>

      {extraFooter}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
