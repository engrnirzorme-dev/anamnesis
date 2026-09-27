const express = require('express');
const db = require('../db');
const router = express.Router();

// 1. Analyze / Generate a new clinical draft
router.post('/analyze', (req, res) => {
    const { patient_id = 1, clinical_question } = req.body;
    
    if (!clinical_question) {
        return res.status(400).json({ error: 'clinical_question is required' });
    }

    // Step A: Build Patient State Snapshot
    // In a real scenario, this would query all tables and build a complex JSON.
    // For this milestone, we use a synthetic/mock snapshot showing the structure.
    const patientStateSnapshot = JSON.stringify({
        demographics: { age: 6, gender: 'M' },
        active_conditions: ['J06.9'],
        recent_medications: ['Парацетамол (пример)'],
        completeness_indicators: { has_labs: true, has_history: true },
        reliability: 'high'
    });

    // Step B: Evidence Used
    const evidenceUsed = JSON.stringify([
        { source: 'visit', id: 1, text: 'Профилактический осмотр' }
    ]);

    // Step C: Pre-Reasoning Safety Gate
    const preSafetyStatus = 'pass';
    const preSafetyDetail = JSON.stringify({ checks: ['correct_patient', 'sufficient_context'], missing_critical_data: false });

    // Step D: NIRZOR Reasoning Draft
    const reasoningResult = `Analysis for: "${clinical_question}"\nPatient is 6yo male with active J06.9. Recent paracetamol course. Condition appears stable.`;

    // Step E: SCV (Self-Consistency Verification)
    const scvStatus = 'pass';
    const scvDetail = JSON.stringify({ claim_vs_evidence: 'verified', contradictions: 0 });

    // Step F: Post-Reasoning Safety Gate
    const postSafetyStatus = 'pass';
    const postSafetyDetail = JSON.stringify({ unsupported_claims: false, overconfident: false });

    // Step G: AI Recommendation Draft
    const aiRecommendationDraft = `Based on the analysis, monitor condition for 48 hours. Continue standard hydration. No new medications recommended at this time.`;

    // Save to DB
    const stmt = db.prepare(`
        INSERT INTO clinical_drafts (
            patient_id, title, clinical_question, patient_state_snapshot, evidence_used,
            pre_safety_status, pre_safety_detail, reasoning_result, scv_status, scv_detail,
            post_safety_status, post_safety_detail, ai_recommendation_draft, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `);

    const info = stmt.run(
        patient_id,
        `Analysis: ${clinical_question.substring(0, 30)}...`,
        clinical_question,
        patientStateSnapshot,
        evidenceUsed,
        preSafetyStatus,
        preSafetyDetail,
        reasoningResult,
        scvStatus,
        scvDetail,
        postSafetyStatus,
        postSafetyDetail,
        aiRecommendationDraft
    );

    res.json({ success: true, draft_id: info.lastInsertRowid });
});

// 2. Get all drafts (Review Queue)
router.get('/drafts', (req, res) => {
    const patient_id = req.headers['x-patient-id'] || 1;
    const drafts = db.prepare('SELECT * FROM clinical_drafts WHERE patient_id = ? ORDER BY created_at DESC').all(patient_id);
    
    // Parse JSON fields for easier frontend consumption
    const parsedDrafts = drafts.map(d => ({
        ...d,
        patient_state_snapshot: JSON.parse(d.patient_state_snapshot || '{}'),
        evidence_used: JSON.parse(d.evidence_used || '[]'),
        pre_safety_detail: JSON.parse(d.pre_safety_detail || '{}'),
        scv_detail: JSON.parse(d.scv_detail || '{}'),
        post_safety_detail: JSON.parse(d.post_safety_detail || '{}')
    }));

    res.json({ drafts: parsedDrafts });
});

// 3. Human Review Action (Approve, Reject, Edit, Escalate)
router.post('/drafts/:id/review', (req, res) => {
    const draftId = req.params.id;
    const { action, note, final_outcome, actor = 'Human Reviewer' } = req.body;
    
    if (!['approved', 'rejected', 'edited', 'escalated'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
    }

    const draft = db.prepare('SELECT * FROM clinical_drafts WHERE id = ?').get(draftId);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    // Update draft status
    db.prepare(`
        UPDATE clinical_drafts 
        SET status = ?, human_review_note = ?, reviewed_at = datetime('now'), reviewed_by = ?
        WHERE id = ?
    `).run(action, note, actor, draftId);

    // Add to Decision Ledger
    db.prepare(`
        INSERT INTO clinical_decision_ledger (draft_id, patient_id, clinical_question, action, actor, final_outcome)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(draftId, draft.patient_id, draft.clinical_question, action, actor, final_outcome || draft.ai_recommendation_draft);

    res.json({ success: true });
});

// 4. Get Decision Ledger
router.get('/ledger', (req, res) => {
    const patient_id = req.headers['x-patient-id'] || 1;
    const ledger = db.prepare(`
        SELECT l.*, d.ai_recommendation_draft 
        FROM clinical_decision_ledger l
        LEFT JOIN clinical_drafts d ON l.draft_id = d.id
        WHERE l.patient_id = ? 
        ORDER BY l.timestamp DESC
    `).all(patient_id);
    res.json({ ledger });
});

module.exports = router;
