import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconShieldLock,
  IconDevices,
  IconKey,
  IconLogout,
  IconTrash,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { api } from '@/shared/api/client';
import { EP } from '@/shared/api/endpoints';
import { getSession } from '@/shared/auth/session';
import { useAuth } from '@/shared/auth/AuthContext';
import { haptic } from '@/shared/lib/haptic';
import { ApiError } from '@/shared/api/errors';
import WebAuthnSection from './SecurityWebAuthnSection';

/**
 * Page Security — управление устройствами, PIN, контрольным словом
 * и биометрией (WebAuthn).
 *
 * Endpoints используемые этой страницей:
 * - GET  /api/auth/security-status  → { has_security_question, question, devices[] }
 * - POST /api/auth/revoke-device     — удалить конкретное устройство
 * - POST /api/auth/logout-all        — разлогинить все кроме текущего
 * - POST /api/auth/change-pin        — смена PIN
 * - POST /api/auth/set-security-question — смена контрольного слова (reuses setup endpoint)
 * - WebAuthn endpoints for биометрии (см. SecurityWebauthnSection)
 */

interface SecurityStatus {
  has_security_question: boolean;
  question: string | null;
  devices: Device[];
}

interface Device {
  id: number;
  device_id: string;
  label: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_ip: string | null;
  user_agent: string | null;
  revoked: number;
}

type Dialog =
  | { kind: 'none' }
  | { kind: 'changePin' }
  | { kind: 'changeAnswer' }
  | { kind: 'confirmRevoke'; device: Device }
  | { kind: 'confirmLogoutAll' };

function formatRelative(iso: string): string {
  const date = new Date(iso.replace(' ', 'T') + (iso.includes('T') ? '' : 'Z'));
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'только что';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} дн ago`;
  return date.toLocaleDateString('ru-RU');
}

function deviceIcon(ua: string | null): string {
  if (!ua) return '🖥';
  const u = ua.toLowerCase();
  if (u.includes('iphone') || u.includes('ipod')) return '📱';
  if (u.includes('ipad')) return '📱';
  if (u.includes('android')) return '📱';
  if (u.includes('mac')) return '💻';
  if (u.includes('windows')) return '💻';
  if (u.includes('linux')) return '💻';
  return '🖥';
}

function deviceBrowser(ua: string | null): string {
  if (!ua) return '';
  const u = ua.toLowerCase();
  if (u.includes('edg')) return 'Edge';
  if (u.includes('chrome')) return 'Chrome';
  if (u.includes('safari')) return 'Safari';
  if (u.includes('firefox')) return 'Firefox';
  return '';
}

export default function SecurityModal() {
  const qc = useQueryClient();
  const currentDeviceId = getSession().deviceId;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['security-status'],
    queryFn: () => api.get<SecurityStatus>(EP.authSecurityStatus),
    retry: false,
  });

  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const showFeedback = useCallback((type: 'ok' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  }, []);

  const activeDevices = (data?.devices ?? []).filter((d) => !d.revoked);

  return (
    <Modal title="Security" desktopStyle="page">
      <div style={{ padding: '0 16px', paddingBottom: 40 }}>
        {feedback && (
          <div
            style={{
              background: feedback.type === 'ok' ? '#E8F7EC' : '#FDECEC',
              color: feedback.type === 'ok' ? '#2E7D32' : '#C62828',
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {feedback.type === 'ok' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
            {feedback.text}
          </div>
        )}

        {/* Шапка */}
        <div
          style={{
            background: 'linear-gradient(135deg,#FF3B30,#FF9500)',
            borderRadius: 14,
            padding: 18,
            color: '#fff',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <IconShieldLock size={24} />
            <div style={{ fontSize: 18, fontWeight: 700 }}>Защита данных</div>
          </div>
          <div style={{ fontSize: 13, opacity: 0.95, lineHeight: 1.4 }}>
            PIN + контрольное слово + доверенные устройства. All сессии переживают рестарт
            сервера, все попытки входа логируются.
          </div>
        </div>

        {/* WebAuthn биометрия */}
        <WebAuthnSection onFeedback={showFeedback} />

        {/* PIN и контрольное слово */}
        <div className="section-subtitle">
          <IconKey size={14} style={{ marginRight: 4 }} /> Секреты
        </div>
        <div className="list-group" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className="list-item"
            onClick={() => {
              haptic('light');
              setDialog({ kind: 'changePin' });
            }}
            style={{
              textAlign: 'left',
              border: 'none',
              background: 'var(--card)',
              cursor: 'pointer',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                Change PIN
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                6 цифр. Старые сессии будут разлогинены.
              </div>
            </div>
            <span style={{ fontSize: 20, color: 'var(--text-secondary)' }}>›</span>
          </button>

          <button
            type="button"
            className="list-item"
            onClick={() => {
              haptic('light');
              setDialog({ kind: 'changeAnswer' });
            }}
            style={{
              textAlign: 'left',
              border: 'none',
              background: 'var(--card)',
              cursor: 'pointer',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                Security word
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {data?.has_security_question
                  ? 'Настроено — меняй если забыл'
                  : 'Не настроено — включи защиту новых устройств'}
              </div>
            </div>
            <span style={{ fontSize: 20, color: 'var(--text-secondary)' }}>›</span>
          </button>
        </div>

        {/* List устройств */}
        <div
          className="section-subtitle"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span>
            <IconDevices size={14} style={{ marginRight: 4 }} /> Trusted devices
            {activeDevices.length > 0 && ` (${activeDevices.length})`}
          </span>
        </div>

        {isLoading && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading…
          </div>
        )}

        {!isLoading && activeDevices.length === 0 && (
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 12,
              padding: 20,
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            Пока нет доверенных устройств
          </div>
        )}

        {activeDevices.length > 0 && (
          <div className="list-group" style={{ marginBottom: 12 }}>
            {activeDevices.map((device, idx) => {
              const isCurrent = device.device_id === currentDeviceId;
              return (
                <div
                  key={device.id}
                  style={{
                    background: 'var(--card)',
                    padding: '14px 16px',
                    borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{deviceIcon(device.user_agent)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                        {device.label || 'Untitled'}
                      </div>
                      {isCurrent && (
                        <span
                          style={{
                            background: 'var(--green)',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 8,
                            textTransform: 'uppercase',
                          }}
                        >
                          это устройство
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {deviceBrowser(device.user_agent)} · IP {device.last_ip || 'unknown'}
                      <br />
                      Active: {formatRelative(device.last_seen_at)} · Added: {formatRelative(device.first_seen_at)}
                    </div>
                  </div>
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => setDialog({ kind: 'confirmRevoke', device })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--red)',
                        cursor: 'pointer',
                        padding: 8,
                      }}
                      aria-label="Delete устройство"
                    >
                      <IconTrash size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeDevices.length > 1 && (
          <Button
            variant="secondary"
            block
            icon={<IconLogout size={16} />}
            onClick={() => setDialog({ kind: 'confirmLogoutAll' })}
          >
            Разлогинить все устройства кроме этого
          </Button>
        )}
      </div>

      {/* Dialogи */}
      {dialog.kind === 'changePin' && (
        <ChangePinDialog
          onClose={() => setDialog({ kind: 'none' })}
          onSuccess={() => {
            setDialog({ kind: 'none' });
            showFeedback('ok', 'PIN changed. Старые сессии ревокированы.');
            refetch();
          }}
          onError={(msg) => showFeedback('error', msg)}
        />
      )}

      {dialog.kind === 'changeAnswer' && (
        <ChangeAnswerDialog
          hasQuestion={!!data?.has_security_question}
          onClose={() => setDialog({ kind: 'none' })}
          onSuccess={() => {
            setDialog({ kind: 'none' });
            showFeedback('ok', 'Security word обновлено');
            refetch();
          }}
          onError={(msg) => showFeedback('error', msg)}
        />
      )}

      {dialog.kind === 'confirmRevoke' && (
        <ConfirmDialog
          title="Delete устройство?"
          description={`"${dialog.device.label || 'Untitled'}" больше не сможет заходить без ввода контрольного слова.`}
          actionLabel="Delete"
          actionVariant="danger"
          busy={busy}
          onCancel={() => setDialog({ kind: 'none' })}
          onConfirm={async () => {
            setBusy(true);
            try {
              await api.post(EP.authRevokeDevice, { device_id: dialog.device.device_id });
              setDialog({ kind: 'none' });
              showFeedback('ok', 'Devicesо удалено');
              await qc.invalidateQueries({ queryKey: ['security-status'] });
            } catch (err) {
              showFeedback('error', err instanceof ApiError ? err.message : 'Error');
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      {dialog.kind === 'confirmLogoutAll' && (
        <ConfirmDialog
          title="Разлогинить все устройства?"
          description="All сессии на других устройствах будут закрыты. Текущее устройство остаётся залогиненным."
          actionLabel="Разлогинить"
          actionVariant="danger"
          busy={busy}
          onCancel={() => setDialog({ kind: 'none' })}
          onConfirm={async () => {
            setBusy(true);
            try {
              await api.post(EP.authLogoutAll);
              setDialog({ kind: 'none' });
              showFeedback('ok', 'All другие сессии закрыты');
              await qc.invalidateQueries({ queryKey: ['security-status'] });
            } catch (err) {
              showFeedback('error', err instanceof ApiError ? err.message : 'Error');
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </Modal>
  );
}

// ───────────────────────────────────────────────────────────
// Change PIN dialog
// ───────────────────────────────────────────────────────────
function ChangePinDialog({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();

  const submit = async () => {
    if (!/^\d{4,10}$/.test(newPin)) return onError('PIN должен быть 4-10 цифр');
    if (newPin !== confirmPin) return onError('Новые PIN не совпадают');

    setBusy(true);
    try {
      const res = await api.post<{ ok: boolean; token: string }>(EP.authChangePin, {
        old_pin: oldPin,
        new_pin: newPin,
      });
      if (res.token) await login(res.token);
      onSuccess();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogShell title="Смена PIN" onClose={onClose}>
      <InlineInput label="Current PIN" value={oldPin} onChange={setOldPin} type="password" inputMode="numeric" />
      <InlineInput label="New PIN (4-10 цифр)" value={newPin} onChange={setNewPin} type="password" inputMode="numeric" />
      <InlineInput label="Repeat new PIN" value={confirmPin} onChange={setConfirmPin} type="password" inputMode="numeric" />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button variant="secondary" block onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          block
          onClick={submit}
          disabled={busy || !oldPin || !newPin || !confirmPin}
        >
          {busy ? 'Mеняем…' : 'Сменить'}
        </Button>
      </div>
    </DialogShell>
  );
}

// ───────────────────────────────────────────────────────────
// Change / Set security answer
// ───────────────────────────────────────────────────────────
function ChangeAnswerDialog({
  hasQuestion,
  onClose,
  onSuccess,
  onError,
}: {
  hasQuestion: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [answer, setAnswer] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (answer.trim().length < 2) return onError('Answer минимум 2 символа');
    if (answer !== confirm) return onError('Answerы не совпадают');

    setBusy(true);
    try {
      await api.post(EP.authSetSecurityQuestion, {
        question: 'Security word',
        answer: answer.trim(),
      });
      onSuccess();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogShell
      title={hasQuestion ? 'Смена контрольного слова' : 'Установка контрольного слова'}
      onClose={onClose}
    >
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          marginBottom: 12,
          lineHeight: 1.4,
        }}
      >
        Короткое слово которое ты будешь вводить при первом входе с нового устройства.
        Регистр и пробелы по краям игнорируются.
      </div>
      <InlineInput label="Новое слово" value={answer} onChange={setAnswer} type="password" />
      <InlineInput label="Повторите слово" value={confirm} onChange={setConfirm} type="password" />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button variant="secondary" block onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button block onClick={submit} disabled={busy || !answer || !confirm}>
          {busy ? 'Сохраняю…' : 'Save'}
        </Button>
      </div>
    </DialogShell>
  );
}

// ───────────────────────────────────────────────────────────
// Generic confirm dialog
// ───────────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  description,
  actionLabel,
  actionVariant,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionVariant?: 'danger';
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogShell title={title} onClose={onCancel}>
      <div
        style={{
          fontSize: 14,
          color: 'var(--text)',
          marginBottom: 16,
          lineHeight: 1.4,
        }}
      >
        {description}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" block onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          block
          onClick={onConfirm}
          disabled={busy}
          style={actionVariant === 'danger' ? { background: 'var(--red)', color: '#fff' } : undefined}
        >
          {busy ? 'Выполняю…' : actionLabel}
        </Button>
      </div>
    </DialogShell>
  );
}

// ───────────────────────────────────────────────────────────
// Shell for диалогов (простое фиксированное окно поверх)
// ───────────────────────────────────────────────────────────
function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          padding: 20,
          paddingBottom: 32,
          maxWidth: 440,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

function InlineInput({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'password';
  inputMode?: 'numeric' | 'text';
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--card)',
          fontSize: 16,
          color: 'var(--text)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

