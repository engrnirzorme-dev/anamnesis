import { IconBrain, IconClock } from '@tabler/icons-react';
import { usePendingAiRequests, useCreateAiRequest } from '../hooks/useDiagnoses';

interface Props {
  entityType: string;
  entityId: number;
}

/**
 * Button зAprоса AI-аналofа. Порт of vanilla `diagnoses.js:52-97`.
 *
 * Логика:
 * - Если в pending AI-requests уже есть record for этой сущности → показываем «Sent»
 * - Иначе → кнопка «ЗAprосить AI-аналof»
 * - After клика → мутация createAiRequest → list инвалидируется → появляется «Sent»
 */
export function AiRequestButton({ entityType, entityId }: Props) {
  const { data: pending } = usePendingAiRequests();
  const mutation = useCreateAiRequest();

  const alreadyPending =
    (pending ?? []).some((r) => r.entity_type === entityType && r.entity_id === entityId) ||
    mutation.isSuccess ||
    mutation.isPending;

  if (alreadyPending) {
    return (
      <div
        style={{
          width: '100%',
          padding: 12,
          border: '1px dashed var(--orange)',
          borderRadius: 12,
          background: 'rgba(255,149,0,0.06)',
          color: 'var(--orange)',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <IconClock size={18} /> ЗAprос на AI-аналof отправлен
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => mutation.mutate({ type: entityType, id: entityId })}
      style={{
        width: '100%',
        padding: 12,
        border: '1px dashed var(--purple)',
        borderRadius: 12,
        background: 'rgba(175,82,222,0.04)',
        color: 'var(--purple)',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <IconBrain size={18} /> ЗAprосить AI-аналof
    </button>
  );
}
