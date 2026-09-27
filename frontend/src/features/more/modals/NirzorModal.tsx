import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconBrain, IconCheck, IconX, IconEdit, IconAlertTriangle } from '@tabler/icons-react';
import { Modal } from '@/shared/ui/Modal';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/api/keys';

interface Draft {
    id: number;
    title: string;
    clinical_question: string;
    patient_state_snapshot: any;
    evidence_used: any;
    pre_safety_status: string;
    pre_safety_detail: any;
    reasoning_result: string;
    scv_status: string;
    scv_detail: any;
    post_safety_status: string;
    post_safety_detail: any;
    ai_recommendation_draft: string;
    status: string;
    human_review_note: string;
    reviewed_at: string;
    reviewed_by: string;
    created_at: string;
}

interface LedgerEntry {
    id: number;
    draft_id: number;
    clinical_question: string;
    action: string;
    actor: string;
    final_outcome: string;
    timestamp: string;
    ai_recommendation_draft: string;
}

export default function NirzorModal() {
    const [activeTab, setActiveTab] = useState<'queue' | 'ledger'>('queue');
    const queryClient = useQueryClient();

    const { data: draftsData, isLoading: draftsLoading } = useQuery({
        queryKey: ['nirzor', 'drafts'],
        queryFn: () => api.get<{ drafts: Draft[] }>('/api/nirzor/drafts').then(res => res.data)
    });

    const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
        queryKey: ['nirzor', 'ledger'],
        queryFn: () => api.get<{ ledger: LedgerEntry[] }>('/api/nirzor/ledger').then(res => res.data)
    });

    const analyzeMutation = useMutation({
        mutationFn: (question: string) => api.post('/api/nirzor/analyze', { clinical_question: question }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nirzor', 'drafts'] });
        }
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, action, note }: { id: number, action: string, note?: string }) => 
            api.post(`/api/nirzor/drafts/${id}/review`, { action, note }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nirzor', 'drafts'] });
            queryClient.invalidateQueries({ queryKey: ['nirzor', 'ledger'] });
        }
    });

    const handleRunAnalysis = () => {
        const q = prompt("Enter clinical question (e.g., 'Какова тактика лечения при текущих симптомах?'):");
        if (q) {
            analyzeMutation.mutate(q);
        }
    };

    return (
        <Modal title="NIRZOR Clinical Intelligence" desktopStyle="page">
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <button 
                        onClick={() => setActiveTab('queue')}
                        style={{ padding: '8px 16px', background: activeTab === 'queue' ? 'var(--blue)' : 'transparent', color: activeTab === 'queue' ? 'white' : 'var(--text)', borderRadius: '8px', border: 'none' }}
                    >
                        Review Queue
                    </button>
                    <button 
                        onClick={() => setActiveTab('ledger')}
                        style={{ padding: '8px 16px', background: activeTab === 'ledger' ? 'var(--blue)' : 'transparent', color: activeTab === 'ledger' ? 'white' : 'var(--text)', borderRadius: '8px', border: 'none' }}
                    >
                        Decision Ledger
                    </button>
                    <button 
                        onClick={handleRunAnalysis}
                        style={{ marginLeft: 'auto', padding: '8px 16px', background: 'var(--green)', color: 'white', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        disabled={analyzeMutation.isPending}
                    >
                        <IconBrain size={16} /> 
                        {analyzeMutation.isPending ? 'Analyzing...' : 'New analysis'}
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {activeTab === 'queue' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {draftsLoading ? <p>Loading...</p> : draftsData?.drafts.length === 0 ? <p>No data в очереди</p> : null}
                            {draftsData?.drafts.map(draft => (
                                <div key={draft.id} style={{ background: 'var(--card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px' }}>{draft.title}</h3>
                                        <span style={{ fontSize: '12px', background: draft.status === 'draft' ? '#FF9500' : 'var(--green)', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                                            {draft.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-secondary)' }}><strong>Question:</strong> {draft.clinical_question}</p>
                                    
                                    <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
                                        <strong>Patient State Snapshot:</strong>
                                        <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{JSON.stringify(draft.patient_state_snapshot, null, 2)}</pre>
                                    </div>

                                    <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
                                        <strong>Evidence Used:</strong>
                                        <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{JSON.stringify(draft.evidence_used, null, 2)}</pre>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: draft.pre_safety_status === 'pass' ? 'var(--green)' : 'var(--red)', color: 'white' }}>
                                            PRE-SAFETY: {draft.pre_safety_status.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: draft.scv_status === 'pass' ? 'var(--green)' : 'var(--red)', color: 'white' }}>
                                            SCV: {draft.scv_status.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: draft.post_safety_status === 'pass' ? 'var(--green)' : 'var(--red)', color: 'white' }}>
                                            POST-SAFETY: {draft.post_safety_status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
                                        <strong>Reasoning Output:</strong>
                                        <p style={{ margin: '4px 0 0' }}>{draft.reasoning_result}</p>
                                    </div>

                                    <div style={{ background: '#007AFF15', borderLeft: '4px solid #007AFF', padding: '12px', borderRadius: '0 8px 8px 0', fontSize: '14px', marginBottom: '16px' }}>
                                        <strong>AI DRAFT RECOMMENDATION:</strong>
                                        <p style={{ margin: '4px 0 0' }}>{draft.ai_recommendation_draft}</p>
                                    </div>

                                    {draft.status === 'draft' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => reviewMutation.mutate({ id: draft.id, action: 'approved', note: 'Looks good' })} style={{ flex: 1, padding: '8px', background: 'var(--green)', color: 'white', borderRadius: '8px', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                                <IconCheck size={16} /> Approve
                                            </button>
                                            <button onClick={() => reviewMutation.mutate({ id: draft.id, action: 'edited', note: 'Modified' })} style={{ flex: 1, padding: '8px', background: 'var(--orange)', color: 'white', borderRadius: '8px', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                                <IconEdit size={16} /> Edit
                                            </button>
                                            <button onClick={() => reviewMutation.mutate({ id: draft.id, action: 'rejected', note: 'Inaccurate' })} style={{ flex: 1, padding: '8px', background: 'var(--red)', color: 'white', borderRadius: '8px', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                                <IconX size={16} /> Reject
                                            </button>
                                            <button onClick={() => reviewMutation.mutate({ id: draft.id, action: 'escalated', note: 'Needs specialist' })} style={{ flex: 1, padding: '8px', background: 'var(--purple)', color: 'white', borderRadius: '8px', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                                <IconAlertTriangle size={16} /> Escalate
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'ledger' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {ledgerLoading ? <p>Loading...</p> : ledgerData?.ledger.length === 0 ? <p>No records в леджере</p> : null}
                            {ledgerData?.ledger.map(entry => (
                                <div key={entry.id} style={{ background: 'var(--card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <strong>{entry.action.toUpperCase()}</strong>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(entry.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        Draft ID: {entry.draft_id} | Actor: {entry.actor}
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '14px' }}>
                                        <strong>Question:</strong> {entry.clinical_question}
                                    </div>
                                    <div style={{ marginTop: '4px', fontSize: '14px', background: 'var(--bg-secondary)', padding: '8px', borderRadius: '6px' }}>
                                        <strong>Final Outcome:</strong> {entry.final_outcome}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
