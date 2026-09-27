import { useParams, useNavigate } from 'react-router';
import {
  IconCalendar,
  IconStethoscope,
  IconUser,
  IconMicrophone,
  IconBrain,
  IconFiles,
  IconEdit,
  IconClock,
} from '@tabler/icons-react';
import { Modal, Badge, Spinner, ExpandableText, Button, CopyButton } from '@/shared/ui';
import { useTimelineItem } from '../hooks/useTimeline';
import { useTimeline } from '../hooks/useTimeline';
import {
  useCreateTimelineAiRequest,
  usePendingAiRequests,
} from '../hooks/useVisitMutations';
import { DocumentBlock } from '../components/DocumentBlock';
import { CommentsSection } from '@/features/comments/CommentsSection';
import { CATEGORY_LABELS } from '../lib/doc-helpers';
import { haptic } from '@/shared/lib/haptic';
import type { Timeline } from '@/shared/types';

/**
 * Route-based модалка деталей вofита.
 * Путь: /documents/visit/:visitId
 *
 * Yesнные берутся of общего кэша `useTimeline()` (массив), а если там нет —
 * делается отдельный зAprос /api/timeline/:id. Это экономит сеть: при клике
 * of списка вofит уже есть в кэше, грузить ничего не надо.
 */
export default function VisitDetailsModal() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const id = visitId ? parseInt(visitId, 10) : null;

  // 1) Пытаемся найти в общем списке (уже загружен при открытии страницы)
  const { data: timeline } = useTimeline();
  const fromList: Timeline | undefined = timeline?.find((t) => t.id === id);

  // 2) Fallback: отдельный зAprос на случай прямого открытия по ссылке/F5
  const { data: fromItem, isLoading } = useTimelineItem(fromList ? null : id);

  const visit = fromList ?? fromItem;

  // AI request state
  const requestAi = useCreateTimelineAiRequest();
  const { data: pendingAi } = usePendingAiRequests();
  const hasAiPending =
    visit != null &&
    (pendingAi ?? []).some(
      (r) => r.entity_type === 'timeline' && r.entity_id === visit.id
    );

  if (!id) return null;

  if (isLoading && !visit) {
    return (
      <Modal title="Loading...">
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spinner size={24} />
        </div>
      </Modal>
    );
  }

  if (!visit) {
    return (
      <Modal title="Not found">
        <p style={{ color: 'var(--text-secondary)' }}>Visit not found or was deleted.</p>
      </Modal>
    );
  }

  const dateStr = new Date(visit.event_date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const specName = visit.specialist_name_resolved ?? visit.specialist_name;
  const specType = visit.specialist_specialty ?? visit.specialist_type;
  const specialistInfo = specName ?? specType;
  const docs = visit.documents ?? [];

  return (
    <Modal title={visit.title}>
      {/* Mетаинфо: категория + дата */}
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <Badge color="gray" icon={<IconStethoscope size={12} />}>
          {(visit.category && CATEGORY_LABELS[visit.category]) ?? visit.category ?? 'Visit'}
        </Badge>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <IconCalendar size={13} style={{ verticalAlign: 'middle', marginRight: 2 }} /> {dateStr}
        </span>
      </div>

      {/* Specialist */}
      {specialistInfo && (
        <div
          style={{
            background: 'var(--bg)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(0,122,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconUser size={20} color="var(--blue)" />
          </div>
          <div>
            {specName && (
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{specName}</div>
            )}
            {specType && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{specType}</div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {visit.description && (
        <div
          style={{
            background: 'var(--bg)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <ExpandableText text={visit.description} bg="var(--bg)" textStyle={{ fontSize: 14, lineHeight: 1.7 }} />
        </div>
      )}

      {visit.notes && (
        <div style={{ marginBottom: 16 }}>
          <ExpandableText
            text={visit.notes}
            bg="var(--card)"
            textStyle={{ fontSize: 13, color: 'var(--text-secondary)' }}
          />
        </div>
      )}

      {/* Transcription */}
      {visit.transcription && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconMicrophone size={14} /> Visit Transcription
            </span>
            <CopyButton text={visit.transcription} />
          </div>
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <ExpandableText
              text={visit.transcription}
              bg="var(--bg)"
              textStyle={{ lineHeight: 1.8 }}
              actionColor="var(--text)"
            />
          </div>
        </div>
      )}

      {/* AI-аналof */}
      {visit.ai_assessment && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--purple)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <IconBrain size={14} /> AI Analysis
          </div>
          <div
            style={{
              background: '#F8F1FC',
              border: '1px solid rgba(175,82,222,0.15)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <ExpandableText
              text={visit.ai_assessment}
              bg="#F8F1FC"
              textStyle={{ lineHeight: 1.8 }}
              actionColor="var(--purple)"
            />
          </div>
        </div>
      )}

      {/* Documents */}
      {docs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <IconFiles size={14} /> Documents ({docs.length})
          </div>
          {docs.map((d) => (
            <DocumentBlock key={d.id} doc={d} />
          ))}
        </div>
      )}

      {/* Кнопки действий: Edit / Add расшифровку / ЗAprосить AI */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          icon={<IconEdit size={14} />}
          onClick={() => {
            haptic('light');
            navigate(`/documents/visit/${visit.id}/edit`);
          }}
        >
          Edit
        </Button>
        {!visit.transcription && (
          <Button
            size="sm"
            icon={<IconMicrophone size={14} />}
            onClick={() => {
              haptic('light');
              navigate(`/documents/visit/${visit.id}/transcription`);
            }}
            style={{
              background: 'rgba(52,199,89,0.12)',
              color: 'var(--green)',
            }}
          >
            Add расшифровку
          </Button>
        )}
        {!visit.ai_assessment && (
          <Button
            size="sm"
            icon={hasAiPending || requestAi.isSuccess ? <IconClock size={14} /> : <IconBrain size={14} />}
            disabled={hasAiPending || requestAi.isPending || requestAi.isSuccess}
            loading={requestAi.isPending}
            onClick={() => {
              haptic('light');
              requestAi.mutate(visit.id);
            }}
            style={{
              background:
                hasAiPending || requestAi.isSuccess
                  ? 'rgba(255,149,0,0.12)'
                  : 'rgba(175,82,222,0.12)',
              color:
                hasAiPending || requestAi.isSuccess
                  ? 'var(--orange)'
                  : 'var(--purple)',
            }}
          >
            {hasAiPending || requestAi.isSuccess
              ? 'Pending analysis AI'
              : 'Request analysis AI'}
          </Button>
        )}
      </div>

      <CommentsSection entityType="timeline" entityId={visit.id} />
    </Modal>
  );
}
