/**
 * Amnt — Reclamations CRUD Page + Email Generation Sub-Module (Premium Light Theme)
 */
import { reclamationsStore, pannesStore, equipementsStore, marchesStore, societesStore, airportsStore, periodStore } from '../services/store.js';
import { auth } from '../services/auth.js';

// ─── SVG Icons ───
const ICONS = {
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
};

// ─── Email Templates Engine ───
const EMAIL_TEMPLATES = {
    NOTIF_PANNE: {
        label: "Demande d'intervention (Courte)",
        subjectFn: (ctx) => `[URGENT / RECLAMATION] - Demande d'intervention corrective - Marché ${ctx.marche}`,
        bodyFn: (ctx) => {
            return `Bonjour,
Nous vous signalons une panne concernant l'équipement suivant : **${ctx.equipement}**.
Description du problème : ${ctx.objetReclamation}.

Conformément aux clauses de notre marché, merci de dépêcher votre équipe technique dans les plus brefs délais pour résolution.

Cordialement,

**${ctx.signataire}**
**${ctx.fonction}**
${ctx.aeroport}`;
        }
    },

    NOTIF_PANNE_DET: {
        label: "Demande d'intervention (Formelle)",
        subjectFn: (ctx) => `Notification de panne — Équipement ${ctx.equipement} — Marché n° ${ctx.marche}`,
        bodyFn: (ctx) => {
            const urgencyIntro = ctx.urgence === 'CRITIQUE' 
                ? `Nous avons l'honneur de porter à votre connaissance, avec la plus haute urgence,`
                : ctx.urgence === 'URGENT'
                    ? `Nous avons l'honneur de porter à votre connaissance, avec urgence,`
                    : `Nous avons l'honneur de porter à votre connaissance`;
            return `Madame, Monsieur,

${urgencyIntro} qu'une panne a été constatée sur l'équipement ${ctx.equipement} relevant de votre marché n° ${ctx.marche}, au niveau de l'aéroport ${ctx.aeroport}.

Date et heure du constat : ${ctx.dateSignalement}
Objet de la réclamation : ${ctx.objetReclamation}

Conformément aux dispositions du cahier des charges et aux clauses contractuelles du marché précité, nous vous demandons de bien vouloir dépêcher votre équipe technique dans les meilleurs délais afin de procéder au diagnostic et à la remise en service de l'équipement concerné.

Nous vous rappelons que le délai contractuel d'intervention (MRT) est fixé à ${ctx.mrt} minutes, et que tout dépassement de ce délai pourra entraîner l'application des pénalités prévues au marché.

Dans l'attente de votre intervention diligente, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

${ctx.signataire}
${ctx.fonction}
Office National Des Aéroports — ONDA`;
        }
    },

    RELANCE_1: {
        label: 'Première relance (Retard)',
        subjectFn: (ctx) => `RELANCE — Retard d'intervention — ${ctx.equipement} — Marché n° ${ctx.marche}`,
        bodyFn: (ctx) => {
            return `Objet : Première relance — Retard d'intervention

Madame, Monsieur,

Suite à notre notification de panne en date du ${ctx.dateSignalement} concernant l'équipement ${ctx.equipement} relevant de votre marché n° ${ctx.marche}, nous constatons qu'aucune intervention n'a été effectuée à ce jour par vos services.

Société prestataire : ${ctx.societe}
Équipement concerné : ${ctx.equipement}
Aéroport : ${ctx.aeroport}

Ce retard constitue un manquement aux obligations contractuelles définies dans le cahier des charges, notamment en ce qui concerne le respect du délai maximal de rétablissement (MRT) fixé à ${ctx.mrt} minutes.

Nous vous mettons en demeure de procéder à l'intervention requise dans les plus brefs délais. À défaut, nous nous réservons le droit d'appliquer les pénalités de retard prévues aux clauses contractuelles.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

${ctx.signataire}
${ctx.fonction}
Office National Des Aéroports — ONDA`;
        }
    },

    RELANCE_2: {
        label: 'Deuxième relance (Mise en garde)',
        subjectFn: (ctx) => `DEUXIÈME RELANCE — Mise en garde — ${ctx.equipement} — Marché n° ${ctx.marche}`,
        bodyFn: (ctx) => {
            return `Objet : Deuxième relance — Mise en garde formelle

Madame, Monsieur,

En référence à notre première relance restée sans suite concernant la panne de l'équipement ${ctx.equipement} relevant du marché n° ${ctx.marche}, nous nous voyons dans l'obligation de vous adresser cette deuxième relance.

Malgré nos précédentes communications, votre société ${ctx.societe} n'a toujours pas procédé à l'intervention corrective requise, ce qui aggrave considérablement la situation et impacte directement la disponibilité des installations de l'aéroport ${ctx.aeroport}.

Date du signalement initial : ${ctx.dateSignalement}
Objet de la réclamation : ${ctx.objetReclamation}

Nous vous informons que ce manquement répété sera consigné dans le rapport d'évaluation de vos prestations et pourra entraîner :
• L'application immédiate des pénalités contractuelles ;
• L'émission d'un constat formel de non-conformité ;
• Toute mesure prévue par les clauses du marché.

Nous vous accordons un délai de 24 heures pour dépêcher votre équipe technique sur site.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

${ctx.signataire}
${ctx.fonction}
Office National Des Aéroports — ONDA`;
        }
    },

    NON_CONFORMITE: {
        label: 'Constat de non-conformité',
        subjectFn: (ctx) => `Constat de non-conformité — Marché n° ${ctx.marche} — ${ctx.equipement}`,
        bodyFn: (ctx) => {
            return `Objet : Constat de non-conformité aux exigences contractuelles

Madame, Monsieur,

Par la présente, nous avons l'honneur de vous notifier un constat de non-conformité relevé dans le cadre de l'exécution du marché n° ${ctx.marche} portant sur la maintenance des équipements techniques de l'aéroport ${ctx.aeroport}.

Société prestataire : ${ctx.societe}
Équipement concerné : ${ctx.equipement}
Date du constat : ${ctx.dateSignalement}
Nature de la non-conformité : ${ctx.objetReclamation}

Ce constat est dressé conformément aux dispositions du cahier des prescriptions spéciales (CPS) et du cahier des clauses administratives générales (CCAG) applicables au marché.

Nous vous demandons de bien vouloir :
1. Prendre connaissance du présent constat ;
2. Nous transmettre vos observations écrites dans un délai de 5 jours ouvrables ;
3. Prendre les mesures correctives nécessaires pour remédier à cette situation.

À défaut de réponse dans le délai imparti, le constat sera considéré comme accepté et les mesures contractuelles correspondantes seront appliquées.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

${ctx.signataire}
${ctx.fonction}
Office National Des Aéroports — ONDA`;
        }
    },

    PENALITES: {
        label: 'Notification de pénalités',
        subjectFn: (ctx) => `Application de pénalités — Marché n° ${ctx.marche}`,
        bodyFn: (ctx) => {
            return `Objet : Notification d'application de pénalités contractuelles

Madame, Monsieur,

Conformément aux clauses du marché n° ${ctx.marche} et en application des dispositions du cahier des prescriptions spéciales relatives aux pénalités de retard et de non-conformité, nous avons l'honneur de vous informer de l'application des pénalités contractuelles suivantes :

Société prestataire : ${ctx.societe}
Aéroport : ${ctx.aeroport}
Équipement concerné : ${ctx.equipement}

Motif de la pénalité :
• Non-respect du délai maximal de rétablissement (MRT) fixé à ${ctx.mrt} minutes
• Date du signalement : ${ctx.dateSignalement}
• Objet : ${ctx.objetReclamation}

Le montant des pénalités sera calculé conformément aux formules prévues au CPS et sera déduit de vos prochaines situations de paiement.

Vous disposez d'un délai de 10 jours ouvrables à compter de la réception de la présente pour formuler vos observations éventuelles.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

${ctx.signataire}
${ctx.fonction}
Office National Des Aéroports — ONDA`;
        }
    },

    MISE_EN_DEMEURE: {
        label: 'Mise en demeure',
        subjectFn: (ctx) => `MISE EN DEMEURE — Marché n° ${ctx.marche} — ${ctx.societe}`,
        bodyFn: (ctx) => {
            return `Objet : Mise en demeure — Manquement grave aux obligations contractuelles

Madame, Monsieur,

Par la présente mise en demeure, nous portons à votre connaissance que votre société ${ctx.societe}, titulaire du marché n° ${ctx.marche} portant sur la maintenance des installations techniques de l'aéroport ${ctx.aeroport}, a fait l'objet de manquements graves et répétés à ses obligations contractuelles.

Les faits reprochés incluent notamment :
• Le non-respect systématique des délais d'intervention (MRT de ${ctx.mrt} minutes) ;
• L'absence de réponse à nos relances précédentes ;
• L'impact direct sur la continuité de service et la sécurité des opérations aéroportuaires.

Référence de la réclamation : ${ctx.objetReclamation}
Date du signalement initial : ${ctx.dateSignalement}
Équipement : ${ctx.equipement}

En conséquence, nous vous mettons formellement en demeure de :
1. Procéder à la remise en état de l'équipement concerné sous 48 heures ;
2. Nous fournir un plan d'action correctif détaillé sous 5 jours ouvrables ;
3. Garantir le respect strict des engagements contractuels pour l'avenir.

À défaut de donner suite à la présente dans les délais impartis, l'ONDA se réserve le droit de recourir à toutes les mesures prévues par le marché et la réglementation en vigueur, y compris la résiliation du marché aux torts exclusifs de votre société.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations les plus distinguées.

${ctx.signataire}
${ctx.fonction}
Office National Des Aéroports — ONDA`;
        }
    }
};

// ─── Delete Confirmation Dialog ───
function confirmDelete(onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
        <div class="modal" style="max-width: 400px; text-align: center; padding: 2rem;">
            <div style="margin-bottom: 1rem;">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" style="margin: 0 auto;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </div>
            <h3 style="margin-bottom: 0.375rem; color: #0f172a; font-size: 1rem;">Confirmer la suppression</h3>
            <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 1.25rem;">Êtes-vous sûr de vouloir supprimer cette réclamation ?</p>
            <div class="flex gap-2 justify-center">
                <button type="button" class="btn btn-secondary" id="btnCancelDelete">Annuler</button>
                <button type="button" class="btn btn-danger" id="btnConfirmDelete">Supprimer</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    const cleanup = () => { overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 200); };
    overlay.querySelector('#btnCancelDelete').addEventListener('click', cleanup);
    overlay.querySelector('#btnConfirmDelete').addEventListener('click', () => { cleanup(); onConfirm(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
}

// ─── Toast Notification Helper ───
function showToast(message, iconType = 'success') {
    // Remove any existing toast
    document.querySelectorAll('.email-toast').forEach(t => t.remove());

    const iconSvg = iconType === 'success'
        ? `<svg class="toast-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        : `<svg class="toast-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

    const toast = document.createElement('div');
    toast.className = 'email-toast';
    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('closing');
        setTimeout(() => toast.remove(), 260);
    }, 2800);
}

// ═══════════════════════════════════════
//  MAIN RENDER FUNCTION
// ═══════════════════════════════════════
export function renderReclamations(container) {
    const currentAirportId = auth.getCurrentAirportId();

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1>Gestion des Réclamations</h1>
                <p class="mb-0">Suivi et traitement des réclamations avec calcul du MRT</p>
            </div>
            <div class="flex gap-2">
                <button id="btnOpenEmail" class="btn btn-secondary" style="gap: 0.5rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Générer un Email
                </button>
                <button id="btnNewReclamation" class="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Nouvelle Réclamation
                </button>
            </div>
        </div>

        <!-- Filter Card -->
        <div class="card mb-6" style="padding: 0.75rem 1.25rem;">
            <div class="flex gap-4 items-center">
                <div class="form-group w-full max-w-xs mb-0">
                    <label class="form-label" style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.25rem;">Filtrer par Période</label>
                    <select id="filterPeriod" class="form-control">
                        <option value="all">Tout afficher (Année en cours)</option>
                        <optgroup label="Par Trimestre">
                            <option value="T1">Trimestre 1 (Jan - Mar)</option>
                            <option value="T2">Trimestre 2 (Avr - Juin)</option>
                            <option value="T3">Trimestre 3 (Juil - Sept)</option>
                            <option value="T4">Trimestre 4 (Oct - Déc)</option>
                        </optgroup>
                        <optgroup label="Par Mois">
                            <option value="01">Janvier</option><option value="02">Février</option><option value="03">Mars</option>
                            <option value="04">Avril</option><option value="05">Mai</option><option value="06">Juin</option>
                            <option value="07">Juillet</option><option value="08">Août</option><option value="09">Septembre</option>
                            <option value="10">Octobre</option><option value="11">Novembre</option><option value="12">Décembre</option>
                        </optgroup>
                    </select>
                </div>
            </div>
        </div>

        <div id="viewContent" class="mb-8"></div>

        <!-- Reclamation CRUD Modal -->
        <div id="reclamationModal" class="modal-overlay">
            <div class="modal" style="max-width: 650px;">
                <div class="modal-header">
                    <h2 id="modalTitle">Nouvelle Réclamation</h2>
                    <button class="modal-close" id="btnCloseModal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <form id="reclamationForm">
                    <div class="modal-body">
                        <input type="hidden" id="reclamationId">
                        
                        <div class="form-group">
                            <label class="form-label">Panne associée</label>
                            <select id="panneId" class="form-control" required></select>
                            <div id="liaisonInfo" class="mt-2" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem; font-size: 0.8125rem; display: none;">
                                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                                    <div><span style="color: #64748b; font-weight: 500;">Équipement :</span> <span id="infoEquipement" style="color: #0f172a;">-</span></div>
                                    <div><span style="color: #64748b; font-weight: 500;">Marché :</span> <span id="infoMarche" style="color: #0f172a;">-</span></div>
                                    <div><span style="color: #64748b; font-weight: 500;">Société :</span> <span id="infoSociete" style="font-weight: 500; color: #0f172a;">-</span></div>
                                </div>
                            </div>
                        </div>

                        <div class="flex gap-4">
                            <div class="form-group w-full">
                                <label class="form-label">Date et Heure du signalement</label>
                                <input type="datetime-local" id="dateSignalement" class="form-control" required>
                            </div>
                            <div class="form-group w-full">
                                <label class="form-label">Statut</label>
                                <select id="statut" class="form-control" required>
                                    <option value="NOUVELLE">Nouvelle / Ouverte</option>
                                    <option value="EN_COURS">En cours</option>
                                    <option value="RESOLUE">Résolue</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Date et Heure d'arrivée de la société <span style="font-weight: 400; color: #94a3b8;">(Optionnel)</span></label>
                            <input type="datetime-local" id="dateArrivee" class="form-control">
                            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">Ce champ peut être rempli plus tard. Nécessaire pour le calcul du MRT.</div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Objet <span style="font-weight: 400; color: #94a3b8;">(Optionnel)</span></label>
                            <input type="text" id="objet" class="form-control" placeholder="Ex: Retard d'intervention, mauvaise exécution...">
                        </div>
                        
                        <div class="form-group mb-0">
                            <label class="form-label">Description détaillée <span style="font-weight: 400; color: #94a3b8;">(Optionnel)</span></label>
                            <textarea id="description" class="form-control" rows="3" placeholder="Détails de la réclamation..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="btnCancel">Annuler</button>
                        <button type="submit" class="btn btn-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ═══════════════════════════════════════ -->
        <!-- EMAIL SLIDE-OVER PANEL                 -->
        <!-- ═══════════════════════════════════════ -->
        <div id="emailOverlay" class="email-slideover-overlay"></div>
        <div id="emailSlideover" class="email-slideover">
            <div class="email-slideover-header">
                <h2>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Générer un Email Professionnel
                </h2>
                <button class="modal-close" id="btnCloseEmail">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="email-slideover-body">
                <!-- Reclamation Selector -->
                <div class="form-group">
                    <label class="form-label">Réclamation liée</label>
                    <select id="emailReclamationSelect" class="form-control"></select>
                </div>

                <!-- Auto-resolved Context Card -->
                <div id="emailContextCard" class="email-context-card" style="display: none;">
                    <div class="ctx-row"><span class="ctx-label">Société</span><span class="ctx-value" id="ctxSociete">—</span></div>
                    <div class="ctx-row"><span class="ctx-label">Marché</span><span class="ctx-value" id="ctxMarche">—</span></div>
                    <div class="ctx-row"><span class="ctx-label">Équipement</span><span class="ctx-value" id="ctxEquipement">—</span></div>
                    <div class="ctx-row"><span class="ctx-label">Aéroport</span><span class="ctx-value" id="ctxAeroport">—</span></div>
                </div>

                <div class="email-form-divider"></div>

                <!-- Email Type & Urgency -->
                <div class="flex gap-4">
                    <div class="form-group w-full">
                        <label class="form-label">Type d'email</label>
                        <select id="emailType" class="form-control">
                            ${Object.entries(EMAIL_TEMPLATES).map(([key, tpl]) => `<option value="${key}">${tpl.label}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="min-width: 140px;">
                        <label class="form-label">Urgence</label>
                        <select id="emailUrgence" class="form-control">
                            <option value="NORMAL">Normal</option>
                            <option value="URGENT">Urgent</option>
                            <option value="CRITIQUE">Critique</option>
                        </select>
                    </div>
                </div>

                <!-- Subject -->
                <div class="form-group">
                    <label class="form-label">Objet de l'email</label>
                    <input type="text" id="emailSubject" class="form-control" placeholder="Généré automatiquement...">
                </div>

                <div class="email-form-divider"></div>

                <!-- Signatory -->
                <div class="flex gap-4">
                    <div class="form-group w-full">
                        <label class="form-label">Nom du signataire</label>
                        <input type="text" id="emailSignataire" class="form-control" placeholder="Votre nom complet">
                    </div>
                    <div class="form-group w-full">
                        <label class="form-label">Fonction</label>
                        <input type="text" id="emailFonction" class="form-control" placeholder="Ex: Chef de Division Maintenance" value="Chef de Division Maintenance">
                    </div>
                </div>

                <!-- Live Preview -->
                <div class="email-preview-section">
                    <div class="email-preview-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Aperçu en temps réel
                    </div>
                    <div class="email-preview" id="emailPreviewZone">
                        <div class="email-preview-header">
                            <img src="/logo.png" alt="ONDA" onerror="this.style.display='none'">
                            <span>Office National Des Aéroports</span>
                        </div>
                        <div class="email-preview-subject" id="previewSubject">—</div>
                        <div class="email-preview-body" id="previewBody" contenteditable="true" title="Cliquez ici pour modifier librement le texte de cet email" style="outline: none;">
                            <span style="color: #94a3b8; font-style: italic; pointer-events: none;">Sélectionnez une réclamation et un type d'email pour générer l'aperçu…</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="email-slideover-footer">
                <button type="button" class="btn btn-secondary" id="btnCopyEmail" style="gap: 0.375rem;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span id="copyBtnText">Copier</span>
                </button>
                <button type="button" class="btn btn-primary" id="btnSimulateSend" style="gap: 0.375rem;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Simuler l'envoi
                </button>
            </div>
        </div>
    `;

    // ═══════════════════════════════════════
    //  RECLAMATION CRUD LOGIC (preserved)
    // ═══════════════════════════════════════
    const modal = document.getElementById('reclamationModal');
    const form = document.getElementById('reclamationForm');
    const panneSelect = document.getElementById('panneId');
    const liaisonInfo = document.getElementById('liaisonInfo');

    const formatDateFR = (dStr) => {
        if (!dStr) return '-';
        const d = new Date(dStr);
        if (isNaN(d)) return '-';
        return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatDateShortFR = (dStr) => {
        if (!dStr) return '-';
        const d = new Date(dStr);
        if (isNaN(d)) return '-';
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const populatePannes = () => {
        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        const pannes = pannesStore.getAll(filters).sort((a, b) => new Date(b.t_panne) - new Date(a.t_panne));
        panneSelect.innerHTML = '<option value="">-- Sélectionner une panne associée --</option>';
        pannes.forEach(p => {
            const eq = equipementsStore.getById(p.equipement_id);
            const eqName = eq ? eq.nom_equipement : 'Inconnu';
            const dateStr = p.t_panne ? new Date(p.t_panne).toLocaleDateString('fr-FR') : '';
            panneSelect.innerHTML += `<option value="${p.id}">Panne du ${dateStr} - Éq: ${eqName} (${p.statut})</option>`;
        });
    };

    const updateLiaisonInfo = () => {
        const pId = panneSelect.value;
        if (!pId) { liaisonInfo.style.display = 'none'; return; }
        const panne = pannesStore.getById(pId);
        if (!panne) { liaisonInfo.style.display = 'none'; return; }
        const eq = equipementsStore.getById(panne.equipement_id);
        const marche = eq ? marchesStore.getById(eq.marche_id) : null;
        const societe = eq ? societesStore.getById(eq.societe_id) : null;
        document.getElementById('infoEquipement').textContent = eq ? `${eq.nom_equipement} - ${eq.designation}` : '-';
        document.getElementById('infoMarche').textContent = marche ? `${marche.numero_marche} - ${marche.objet}` : '-';
        document.getElementById('infoSociete').textContent = societe ? (societe.nom || societe.raison_sociale) : '-';
        liaisonInfo.style.display = 'block';
    };

    panneSelect.addEventListener('change', updateLiaisonInfo);

    const calculateMRT = (dateSignalement, dateArrivee) => {
        if (!dateSignalement || !dateArrivee) return null;
        const diffMs = new Date(dateArrivee) - new Date(dateSignalement);
        if (diffMs < 0) return '0min';
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        if (hours > 0) {
            return `${hours}h ${mins}min`;
        }
        return `${mins}min`;
    };

    const renderTable = () => {
        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        const recs = reclamationsStore.getAll(filters).sort((a, b) => {
            const dA = new Date(a.date_signalement || a.created_at || 0);
            const dB = new Date(b.date_signalement || b.created_at || 0);
            return dB - dA;
        });
        const selectedPeriod = periodStore.getPeriod();
        const now = new Date();
        const currentYear = now.getFullYear();

        const filteredRecs = recs.filter(item => {
            if (selectedPeriod === 'all') return true;
            const dateStr = item.date_signalement || item.t_notification || item.created_at;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            if (isNaN(d)) return false;
            if (d.getFullYear() !== currentYear) return false;
            const monthIndex = d.getMonth();
            if (selectedPeriod.startsWith('T')) {
                const quarter = Math.floor(monthIndex / 3) + 1;
                return `T${quarter}` === selectedPeriod;
            } else {
                const monthStr = String(monthIndex + 1).padStart(2, '0');
                return monthStr === selectedPeriod;
            }
        });

        const viewContent = document.getElementById('viewContent');

        if (filteredRecs.length === 0) {
            viewContent.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <p>Aucune réclamation trouvée pour la période sélectionnée.</p>
                </div>`;
            return;
        }

        let rowsHtml = filteredRecs.map(r => {
            const panne = pannesStore.getById(r.panne_id);
            let socName = '-';
            let eqName = 'Panne non liée';
            if (panne) {
                const eq = equipementsStore.getById(panne.equipement_id);
                if (eq) {
                    eqName = eq.nom_equipement;
                    const soc = societesStore.getById(eq.societe_id);
                    if (soc) socName = soc.nom || soc.raison_sociale;
                }
            }
            let badgeClass = 'neutral';
            let statutLabel = r.statut || 'NOUVELLE';
            if (statutLabel === 'NOUVELLE') { badgeClass = 'danger'; statutLabel = 'Nouvelle / Ouverte'; }
            if (statutLabel === 'EN_COURS') { badgeClass = 'warning'; statutLabel = 'En cours'; }
            if (statutLabel === 'RESOLUE') { badgeClass = 'success'; statutLabel = 'Résolue'; }
            const mrtStr = calculateMRT(r.date_signalement || r.t_notification, r.date_arrivee || r.t_arrivee);
            let mrtHtml = mrtStr 
                ? `<span style="font-weight: 500; font-family: var(--font-mono, monospace); font-size: 0.8125rem;">${mrtStr}</span>` 
                : `<span style="font-style: italic; font-size: 0.8125rem; color: #94a3b8;">En attente d'arrivée...</span>`;
            return `
                <tr>
                    <td>${formatDateFR(r.date_signalement || r.t_notification)}</td>
                    <td>
                        <div style="font-weight: 500; color: #0f172a; margin-bottom: 0.125rem;">${r.objet || 'Sans objet'}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">Éq: ${eqName}</div>
                    </td>
                    <td>${socName}</td>
                    <td><span class="badge badge-${badgeClass}">${statutLabel}</span></td>
                    <td>${mrtHtml}</td>
                    <td style="width: 100px; min-width: 100px;">
                        <div class="action-group" style="display: flex; gap: 0.25rem; justify-content: flex-end;">
                            <button class="btn-action-icon btn-edit" data-id="${r.id}" title="Éditer">
                                ${ICONS.edit}
                            </button>
                            <button class="btn-action-icon btn-delete" data-id="${r.id}" title="Supprimer">
                                ${ICONS.trash}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        viewContent.innerHTML = `
            <div class="table-container">
                <div class="overflow-x-auto w-full">
                    <table class="table min-w-[900px]">
                        <thead>
                            <tr>
                                <th>Date signalement</th>
                                <th>Panne / Objet</th>
                                <th>Société</th>
                                <th>Statut</th>
                                <th>MRT</th>
                                <th style="width: 100px; min-width: 100px; text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;

        viewContent.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.getAttribute('data-id')));
        });
        viewContent.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                confirmDelete(() => { reclamationsStore.delete(id); renderTable(); });
            });
        });
    };

    const openModal = (id = null) => {
        form.reset();
        document.getElementById('reclamationId').value = '';
        document.getElementById('modalTitle').textContent = 'Nouvelle Réclamation';
        populatePannes();
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        document.getElementById('dateSignalement').value = `${year}-${month}-${day}T09:00`;
        document.getElementById('dateArrivee').value = '';
        document.getElementById('statut').value = 'NOUVELLE';
        if (id) {
            const r = reclamationsStore.getById(id);
            if (r) {
                document.getElementById('modalTitle').textContent = 'Éditer la Réclamation';
                document.getElementById('reclamationId').value = r.id;
                const ds = r.date_signalement || r.t_notification;
                if (ds) document.getElementById('dateSignalement').value = ds.slice(0, 16);
                const da = r.date_arrivee || r.t_arrivee;
                if (da) document.getElementById('dateArrivee').value = da.slice(0, 16);
                document.getElementById('statut').value = r.statut || 'NOUVELLE';
                document.getElementById('panneId').value = r.panne_id || '';
                document.getElementById('objet').value = r.objet || '';
                document.getElementById('description').value = r.description || '';
            }
        }
        updateLiaisonInfo();
        modal.classList.add('active');
    };

    const closeModal = () => modal.classList.remove('active');

    document.getElementById('btnNewReclamation').addEventListener('click', () => openModal());
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnCancel').addEventListener('click', closeModal);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const pId = document.getElementById('panneId').value;
        const panne = pannesStore.getById(pId);
        const airportId = panne ? panne.airport_id : currentAirportId;
        let sigVal = document.getElementById('dateSignalement').value;
        let arrVal = document.getElementById('dateArrivee').value;
        if (sigVal) {
            sigVal = sigVal.trim();
            if (sigVal.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(sigVal)) { sigVal = sigVal + 'T09:00'; }
            else if (sigVal.includes('T')) {
                const parts = sigVal.split('T');
                if (!parts[1] || parts[1].trim() === '' || parts[1] === '00:00') { sigVal = parts[0] + 'T09:00'; }
            }
        }
        if (arrVal) {
            arrVal = arrVal.trim();
            if (arrVal.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(arrVal)) { arrVal = arrVal + 'T09:00'; }
            else if (arrVal.includes('T')) {
                const parts = arrVal.split('T');
                if (!parts[1] || parts[1].trim() === '' || parts[1] === '00:00') { arrVal = parts[0] + 'T09:00'; }
            }
        }
        const sigISO = sigVal ? (sigVal.includes('Z') ? sigVal : sigVal + ':00Z') : null;
        const arrISO = arrVal ? (arrVal.includes('Z') ? arrVal : arrVal + ':00Z') : null;
        const data = {
            airport_id: airportId,
            panne_id: pId,
            date_signalement: sigISO,
            t_notification: sigISO,
            date_arrivee: arrISO,
            t_arrivee: arrISO,
            statut: document.getElementById('statut').value,
            objet: document.getElementById('objet').value || '',
            description: document.getElementById('description').value || '',
            saisi_par: auth.getCurrentUser().id
        };
        const id = document.getElementById('reclamationId').value;
        if (id) { reclamationsStore.update(id, data); } else { reclamationsStore.create(data); }
        closeModal();
        renderTable();
    });

    // ═══════════════════════════════════════
    //  EMAIL SLIDE-OVER LOGIC
    // ═══════════════════════════════════════
    const emailOverlay = document.getElementById('emailOverlay');
    const emailSlideover = document.getElementById('emailSlideover');
    const emailRecSelect = document.getElementById('emailReclamationSelect');
    const emailContextCard = document.getElementById('emailContextCard');
    const emailType = document.getElementById('emailType');
    const emailUrgence = document.getElementById('emailUrgence');
    const emailSubject = document.getElementById('emailSubject');
    const emailSignataire = document.getElementById('emailSignataire');
    const emailFonction = document.getElementById('emailFonction');
    const previewSubject = document.getElementById('previewSubject');
    const previewBody = document.getElementById('previewBody');

    // Pre-fill signataire from auth
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
        emailSignataire.value = `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim();
    }

    // Current email context (resolved data)
    let emailCtx = {
        societe: '', marche: '', equipement: '', aeroport: '',
        dateSignalement: '', objetReclamation: '', mrt: '60',
        signataire: '', fonction: '', urgence: 'NORMAL'
    };

    const openEmailPanel = () => {
        populateEmailReclamations();
        emailOverlay.classList.add('active');
        // Slight delay for staggered animation
        requestAnimationFrame(() => emailSlideover.classList.add('active'));
    };

    const closeEmailPanel = () => {
        emailSlideover.classList.remove('active');
        setTimeout(() => emailOverlay.classList.remove('active'), 300);
    };

    const populateEmailReclamations = () => {
        let filters = {};
        if (currentAirportId !== 'all') filters.airport_id = currentAirportId;
        const recs = reclamationsStore.getAll(filters).sort((a, b) => {
            const dA = new Date(a.date_signalement || a.created_at || 0);
            const dB = new Date(b.date_signalement || b.created_at || 0);
            return dB - dA;
        });
        emailRecSelect.innerHTML = '<option value="">— Sélectionnez une réclamation —</option>';
        recs.forEach(r => {
            const dateStr = formatDateShortFR(r.date_signalement || r.t_notification);
            const label = r.objet ? `${dateStr} — ${r.objet}` : `${dateStr} — Réclamation`;
            emailRecSelect.innerHTML += `<option value="${r.id}">${label}</option>`;
        });
    };

    // Resolve full context chain from a reclamation
    const resolveEmailContext = (reclamationId) => {
        const rec = reclamationsStore.getById(reclamationId);
        if (!rec) {
            emailContextCard.style.display = 'none';
            return false;
        }

        // Resolve panne → equipement → societe & marche
        const panne = pannesStore.getById(rec.panne_id);
        const eq = panne ? equipementsStore.getById(panne.equipement_id) : null;
        const societe = eq ? societesStore.getById(eq.societe_id) : null;
        const marche = eq ? marchesStore.getById(eq.marche_id) : null;

        // Resolve airport name
        let aeroport = 'Aéroport ONDA';
        if (rec.airport_id) {
            const ap = airportsStore.getById(rec.airport_id);
            if (ap) aeroport = `${ap.nom} (${ap.code_iata})`;
        }

        // Resolve MRT from marche SLA
        const mrt = marche ? (marche.sla_mrt || 60) : 60;

        // Populate context
        const socName = societe ? (societe.nom || societe.raison_sociale) : 'Non spécifiée';
        const marcheNum = marche ? marche.numero_marche : 'Non spécifié';
        const eqLabel = eq ? `${eq.nom_equipement || eq.code_equipement} — ${eq.designation || ''}` : 'Non spécifié';

        document.getElementById('ctxSociete').textContent = socName;
        document.getElementById('ctxMarche').textContent = marcheNum;
        document.getElementById('ctxEquipement').textContent = eqLabel;
        document.getElementById('ctxAeroport').textContent = aeroport;
        emailContextCard.style.display = 'flex';

        // Store in context object
        emailCtx.societe = socName;
        emailCtx.marche = marcheNum;
        emailCtx.equipement = eqLabel;
        emailCtx.aeroport = aeroport;
        emailCtx.dateSignalement = formatDateFR(rec.date_signalement || rec.t_notification);
        emailCtx.objetReclamation = rec.objet || 'Réclamation corrective';
        emailCtx.mrt = String(mrt);

        return true;
    };

    const generateEmail = () => {
        const templateKey = emailType.value;
        const template = EMAIL_TEMPLATES[templateKey];
        if (!template) return;

        // Update context with form fields
        emailCtx.signataire = emailSignataire.value || 'Le Responsable';
        emailCtx.fonction = emailFonction.value || 'Chef de Division Maintenance';
        emailCtx.urgence = emailUrgence.value;

        const subject = template.subjectFn(emailCtx);
        const body = template.bodyFn(emailCtx);

        // Update subject field
        emailSubject.value = subject;

        // Update live preview
        previewSubject.textContent = subject;
        previewBody.textContent = body;
    };

    const updatePreview = () => {
        if (!emailRecSelect.value) {
            previewSubject.textContent = '—';
            previewBody.innerHTML = '<span style="color: #94a3b8; font-style: italic;">Sélectionnez une réclamation et un type d\'email pour générer l\'aperçu…</span>';
            return;
        }
        generateEmail();
    };

    // ─── Event Listeners for Email Panel ───
    document.getElementById('btnOpenEmail').addEventListener('click', openEmailPanel);
    document.getElementById('btnCloseEmail').addEventListener('click', closeEmailPanel);
    emailOverlay.addEventListener('click', closeEmailPanel);

    emailRecSelect.addEventListener('change', () => {
        if (emailRecSelect.value) {
            resolveEmailContext(emailRecSelect.value);
        } else {
            emailContextCard.style.display = 'none';
        }
        updatePreview();
    });

    emailType.addEventListener('change', updatePreview);
    emailUrgence.addEventListener('change', updatePreview);
    emailSignataire.addEventListener('input', updatePreview);
    emailFonction.addEventListener('input', updatePreview);
    emailSubject.addEventListener('input', () => {
        previewSubject.textContent = emailSubject.value;
    });

    // Copy to clipboard
    document.getElementById('btnCopyEmail').addEventListener('click', () => {
        const subject = emailSubject.value;
        const body = previewBody.innerText;
        if (!body || body.includes('Sélectionnez une réclamation')) {
            showToast('Veuillez d\'abord générer un email.', 'copy');
            return;
        }
        const fullText = `Objet : ${subject}\n\n${body}`;
        navigator.clipboard.writeText(fullText).then(() => {
            const copyBtnText = document.getElementById('copyBtnText');
            copyBtnText.textContent = '✓ Copié !';
            showToast('Email copié dans le presse-papier', 'copy');
            setTimeout(() => { copyBtnText.textContent = 'Copier'; }, 2200);
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = `Objet : ${subject}\n\n${body}`;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            const copyBtnText = document.getElementById('copyBtnText');
            copyBtnText.textContent = '✓ Copié !';
            showToast('Email copié dans le presse-papier', 'copy');
            setTimeout(() => { copyBtnText.textContent = 'Copier'; }, 2200);
        });
    });

    // Simulate send
    document.getElementById('btnSimulateSend').addEventListener('click', () => {
        const body = previewBody.innerText;
        if (!body || body.includes('Sélectionnez une réclamation')) {
            showToast('Veuillez d\'abord générer un email.', 'copy');
            return;
        }

        const btn = document.getElementById('btnSimulateSend');
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 0.7s linear infinite;" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Envoi en cours...
        `;
        btn.style.cssText += 'pointer-events: none; opacity: 0.7;';

        // Simulate network delay
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            btn.style.cssText = btn.style.cssText.replace('pointer-events: none; opacity: 0.7;', '');
            showToast(`Email envoyé avec succès à ${emailCtx.societe}`, 'success');
        }, 1500);
    });

    // ═══════════════════════════════════════
    //  PERIOD FILTER & LIFECYCLE
    // ═══════════════════════════════════════
    const filterPeriodSelect = document.getElementById('filterPeriod');
    filterPeriodSelect.value = periodStore.getPeriod();
    filterPeriodSelect.addEventListener('change', (e) => { periodStore.setPeriod(e.target.value); });

    const onPeriodChange = (e) => { filterPeriodSelect.value = e.detail.period; renderTable(); };
    const onAirportChange = () => { renderReclamations(container); };
    const onStoreChanged = (e) => { if (['reclamations', 'pannes', 'equipements'].includes(e.detail.collection)) { renderTable(); } };

    window.addEventListener('period-change', onPeriodChange);
    window.addEventListener('airport-change', onAirportChange, { once: true });
    window.addEventListener('store-changed', onStoreChanged);

    const cleanup = () => {
        window.removeEventListener('period-change', onPeriodChange);
        window.removeEventListener('airport-change', onAirportChange);
        window.removeEventListener('store-changed', onStoreChanged);
        window.removeEventListener('page-destroy', cleanup);
    };
    window.addEventListener('page-destroy', cleanup);

    renderTable();
}
