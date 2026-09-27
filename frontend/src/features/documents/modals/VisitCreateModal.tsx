import { Modal } from '@/shared/ui';
import { useRouteModal } from '@/shared/hooks/useRouteModal';
import { VisitForm } from '../components/VisitForm';
import { useCreateVisit } from '../hooks/useVisitMutations';

/**
 * Mодалка создания нового вofита. Route: `/documents/new`
 */
export default function VisitCreateModal() {
  const { closeModal } = useRouteModal();
  const mutation = useCreateVisit();

  return (
    <Modal title="New Visit">
      <VisitForm
        onSubmit={async (data) => {
          await mutation.mutateAsync(data);
          closeModal();
        }}
        submitting={mutation.isPending}
        submitLabel="Create visit"
      />
    </Modal>
  );
}
