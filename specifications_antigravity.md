# Spécifications Techniques et Fonctionnelles — Antigravity

**Application de Gestion de la Maintenance Aéroportuaire pour l'ONDA**

| Champ | Valeur |
|---|---|
| Nom du projet | Antigravity |
| Client | Office National Des Aéroports (ONDA) — Maroc |
| Version | 1.0.0 |
| Date | 2026-05-13 |
| Statut | Draft |

---

## Table des Matières

1. [Vue d'Ensemble du Projet & Architecture Multi-Tenant](#1-vue-densemble-du-projet--architecture-multi-tenant)
2. [Rôles et Gestion des Accès (RBAC)](#2-rôles-et-gestion-des-accès-rbac)
3. [Spécifications des Interfaces et Workflows](#3-spécifications-des-interfaces-et-workflows)
4. [Moteur de Calcul des KPIs](#4-moteur-de-calcul-des-kpis)
5. [Module de Reporting et Exportation](#5-module-de-reporting-et-exportation)
6. [Exigences Techniques & Schéma de Base de Données](#6-exigences-techniques--schéma-de-base-de-données)

---

## 1. Vue d'Ensemble du Projet & Architecture Multi-Tenant

### 1.1 Description du Produit

**Antigravity** est une plateforme web conçue pour digitaliser et centraliser la gestion de la maintenance des équipements critiques au sein de l'ensemble des aéroports marocains gérés par l'ONDA.

#### Proposition de Valeur

| Problème actuel | Solution Antigravity |
|---|---|
| Suivi manuel des marchés (papier/Excel) | Référentiel numérique centralisé |
| Calcul manuel des KPIs | Moteur de calcul automatisé (PRR, Disponibilité, MRT) |
| Absence de traçabilité | Horodatage précis de chaque événement |
| Reporting non standardisé | Rapports PDF/Excel générés automatiquement |
| Données éparpillées par aéroport | Architecture multi-tenant unifiée |

### 1.2 Architecture Multi-Tenant

Chaque aéroport constitue un **tenant** isolé. Les données d'un aéroport ne sont jamais accessibles depuis un autre, sauf pour le Super-Admin ONDA (vue nationale consolidée).

#### Stratégie d'isolation

- **Approche** : Base de données partagée avec colonne discriminante `airport_id` sur chaque table.
- **Filtrage** : Middleware automatique injectant le filtre `airport_id` dans chaque requête.
- **Sécurité** : Row-Level Security (RLS) au niveau base de données comme couche de protection supplémentaire.

#### Hiérarchie des Entités

```
ONDA (National)
└── Aéroport (Tenant)
    └── Marché (Contrat de maintenance)
        └── Société Prestataire
            └── Équipements
                ├── Interventions Préventives
                ├── Pannes (Arrêts)
                └── Réclamations (Réactivité)
```

Chaque entité enfant hérite du `airport_id` de son parent, garantissant une isolation stricte.

### 1.3 Liste des Aéroports (Tenants)

Le système doit supporter à minima les aéroports internationaux et régionaux de l'ONDA :
Mohammed V (Casablanca), Marrakech-Ménara, Fès-Saïss, Rabat-Salé, Tanger-Ibn Battouta, Agadir Al-Massira, Oujda-Angads, Nador-Al Aroui, Essaouira, Ouarzazate, Errachidia, Laâyoune, Dakhla, Guelmim, Tétouan, Beni Mellal, Al Hoceima.

---

## 2. Rôles et Gestion des Accès (RBAC)

### 2.1 Matrice des Rôles

| Permission | Super-Admin ONDA | Superviseur Aéroport | Technicien |
|---|:---:|:---:|:---:|
| Créer/modifier un aéroport | ✅ | ❌ | ❌ |
| Voir les stats nationales | ✅ | ❌ | ❌ |
| Gérer les utilisateurs | ✅ (tous) | ✅ (locaux) | ❌ |
| Créer/modifier un marché | ✅ | ✅ | ❌ |
| Gérer les sociétés | ✅ | ✅ | ❌ |
| Gérer les équipements | ✅ | ✅ | ❌ |
| Saisir des interventions | ✅ | ✅ | ✅ |
| Saisir des pannes | ✅ | ✅ | ✅ |
| Saisir des réclamations | ✅ | ✅ | ✅ |
| Valider les saisies | ✅ | ✅ | ❌ |
| Consulter les KPIs | ✅ (tous) | ✅ (local) | ❌ |
| Générer des rapports | ✅ | ✅ | ❌ |
| Exporter PDF/Excel | ✅ | ✅ | ❌ |

### 2.2 Super-Admin ONDA

- **Périmètre** : Vision globale sur tous les aéroports.
- **Fonctions clés** :
  - Dashboard national avec KPIs agrégés.
  - Comparaison inter-aéroports (benchmarking).
  - Administration : création d'aéroports, affectation des superviseurs.
  - Accès en lecture à toutes les données de chaque tenant.

### 2.3 Superviseur d'Aéroport

- **Périmètre** : Données cloisonnées à son aéroport assigné uniquement.
- **Fonctions clés** :
  - Onboarding : configuration des marchés, sociétés, équipements.
  - Gestion opérationnelle : validation des saisies, suivi des pannes.
  - Consultation des KPIs de son aéroport.
  - Génération et export des rapports.

### 2.4 Technicien / Agent de Saisie

- **Périmètre** : Saisie brute uniquement, aucune modification ni suppression.
- **Fonctions clés** :
  - Saisie des interventions préventives réalisées.
  - Saisie des pannes (T_panne, T_reprise).
  - Saisie des réclamations (T_notification, T_arrivée).

### 2.5 Authentification & Sécurité

- **JWT** (JSON Web Token) avec refresh tokens.
- **Durée de session** : Access token 15 min, refresh token 7 jours.
- **Mot de passe** : Hashage bcrypt, politique de complexité (8+ caractères, majuscule, chiffre, caractère spécial).
- **Audit Trail** : Journalisation de toutes les actions (qui, quoi, quand, IP).

---

## 3. Spécifications des Interfaces et Workflows

### 3.1 Interface 1 — Référentiel & Configuration

#### 3.1.1 Gestion des Marchés

**Objectif** : Enregistrer les contrats de maintenance liant l'ONDA aux sociétés prestataires.

| Champ | Type | Obligatoire | Description |
|---|---|:---:|---|
| `numero_marche` | String (unique/tenant) | ✅ | Numéro officiel du marché |
| `objet` | Text | ✅ | Description de l'objet du marché |
| `type_maintenance` | Enum | ✅ | `PREVENTIVE`, `CORRECTIVE`, `MIXTE` |
| `sla_disponibilite` | Float (%) | ✅ | Seuil contractuel de disponibilité (ex: 95%) |
| `sla_prr` | Float (%) | ✅ | Seuil contractuel du PRR (ex: 90%) |
| `sla_mrt` | Float (minutes) | ✅ | Temps de réaction max contractuel (ex: 60 min) |
| `date_debut` | Date | ✅ | Date de début du marché |
| `date_fin` | Date | ✅ | Date de fin du marché |
| `montant_total` | Decimal | ❌ | Montant total du marché (MAD) |
| `penalite_par_infraction` | Decimal | ❌ | Montant de pénalité par infraction SLA |
| `statut` | Enum | ✅ | `BROUILLON`, `ACTIF`, `EXPIRE`, `RESILIE` |

**Workflow de création** :
1. Superviseur crée le marché (statut `BROUILLON`).
2. Superviseur ajoute les sociétés et équipements liés.
3. Superviseur active le marché (statut `ACTIF`).
4. Le système passe automatiquement à `EXPIRE` si `date_fin < aujourd'hui`.

#### 3.1.2 Gestion des Sociétés Prestataires

| Champ | Type | Obligatoire | Description |
|---|---|:---:|---|
| `raison_sociale` | String | ✅ | Nom légal de la société |
| `rc_number` | String | ✅ | Numéro du Registre de Commerce |
| `ice` | String | ✅ | Identifiant Commun de l'Entreprise |
| `adresse` | Text | ✅ | Adresse du siège social |
| `telephone` | String | ✅ | Téléphone principal |
| `email_contact` | Email | ✅ | Email principal |
| `email_notification` | Email | ✅ | Email pour les notifications automatiques |
| `contact_urgence_nom` | String | ✅ | Nom du contact d'urgence |
| `contact_urgence_tel` | String | ✅ | Téléphone d'urgence |
| `marche_id` | FK → Marché | ✅ | Marché auquel la société est rattachée |

#### 3.1.3 Gestion des Équipements

| Champ | Type | Obligatoire | Description |
|---|---|:---:|---|
| `code_equipement` | String (unique/tenant) | ✅ | Code unique de l'équipement |
| `designation` | String | ✅ | Nom de l'équipement |
| `categorie` | Enum | ✅ | `ELECTRIQUE`, `MECANIQUE`, `CVC`, `INCENDIE`, `BALISAGE`, `PASSERELLE`, `ASCENSEUR`, `AUTRE` |
| `localisation` | String | ✅ | Emplacement dans l'aéroport |
| `criticite` | Enum | ✅ | `CRITIQUE`, `IMPORTANT`, `STANDARD` |
| `date_mise_en_service` | Date | ❌ | Date de mise en service |
| `marche_id` | FK → Marché | ✅ | Marché couvrant cet équipement |
| `societe_id` | FK → Société | ✅ | Société responsable de la maintenance |
| `statut` | Enum | ✅ | `EN_SERVICE`, `EN_PANNE`, `HORS_SERVICE`, `EN_MAINTENANCE` |
| `heures_fonctionnement_jour` | Float | ✅ | Heures de fonctionnement théorique/jour (ex: 24, 16, 8) |

### 3.2 Interface 2 — Opérations & Collecte des Données

#### 3.2.1 Module Maintenance Préventive (→ KPI : PRR)

**Objectif** : Comparer les interventions planifiées vs réalisées chaque mois.

| Champ | Type | Obligatoire | Description |
|---|---|:---:|---|
| `equipement_id` | FK → Équipement | ✅ | Équipement concerné |
| `mois` | Date (YYYY-MM) | ✅ | Mois de référence |
| `nb_interventions_planifiees` | Integer | ✅ | Nombre prévu au contrat |
| `nb_interventions_realisees` | Integer | ✅ | Nombre effectivement réalisé |
| `observations` | Text | ❌ | Notes libres |
| `pieces_jointes` | File[] | ❌ | PV d'intervention, photos |
| `saisi_par` | FK → User | Auto | Utilisateur ayant saisi |
| `valide_par` | FK → User | ❌ | Superviseur ayant validé |
| `statut_validation` | Enum | Auto | `EN_ATTENTE`, `VALIDE`, `REJETE` |

**Workflow** :
1. Technicien saisit les données préventives du mois.
2. Superviseur valide ou rejette avec commentaire.
3. Données validées alimentent le calcul du PRR.

#### 3.2.2 Module Gestion des Pannes (→ KPI : Disponibilité)

**Objectif** : Enregistrer précisément les temps d'arrêt des équipements.

| Champ | Type | Obligatoire | Description |
|---|---|:---:|---|
| `equipement_id` | FK → Équipement | ✅ | Équipement en panne |
| `t_panne` | DateTime | ✅ | Horodatage exact de l'arrêt |
| `t_reprise` | DateTime | ❌ | Horodatage de la remise en service |
| `duree_arret_minutes` | Integer | Auto | Calculé : `t_reprise - t_panne` |
| `cause_panne` | Enum | ✅ | `USURE`, `DEFAUT_ELECTRIQUE`, `DEFAUT_MECANIQUE`, `FACTEUR_EXTERNE`, `INCONNU` |
| `description` | Text | ✅ | Description de la panne |
| `actions_correctives` | Text | ❌ | Actions entreprises |
| `impact` | Enum | ✅ | `CRITIQUE`, `MAJEUR`, `MINEUR` |
| `statut` | Enum | Auto | `OUVERTE`, `EN_COURS`, `RESOLUE` |

**Workflow** :
1. Saisie de la panne avec `t_panne` → statut `OUVERTE`, équipement passe à `EN_PANNE`.
2. Intervention en cours → statut `EN_COURS`.
3. Saisie de `t_reprise` → statut `RESOLUE`, équipement repasse à `EN_SERVICE`.
4. Calcul auto de `duree_arret_minutes`.

#### 3.2.3 Module Réactivité (→ KPI : MRT)

**Objectif** : Mesurer le temps de réaction de la société prestataire.

| Champ | Type | Obligatoire | Description |
|---|---|:---:|---|
| `panne_id` | FK → Panne | ✅ | Panne concernée |
| `t_notification` | DateTime | ✅ | Horodatage de la notification (appel/email) |
| `moyen_notification` | Enum | ✅ | `APPEL`, `EMAIL`, `SMS`, `APPLICATION` |
| `t_arrivee` | DateTime | ❌ | Arrivée effective sur site |
| `temps_reaction_minutes` | Integer | Auto | Calculé : `t_arrivee - t_notification` |
| `conforme_sla` | Boolean | Auto | `temps_reaction_minutes <= marche.sla_mrt` |
| `commentaire` | Text | ❌ | Observations |
## 4. Moteur de Calcul des KPIs (Modèle Mathématique)

### 4.1 Vue d'Ensemble des KPIs

| KPI | Abréviation | Unité | Seuil SLA typique | Fréquence de calcul |
|---|---|---|---|---|
| Taux de Respect du Planning | PRR | % | ≥ 90% | Mensuel |
| Disponibilité | D | % | ≥ 95% | Mensuel |
| Temps Moyen de Réaction | MRT | Minutes | ≤ 60 min | Mensuel |

### 4.2 Indicateur 1 : PRR (Planning Respect Rate)

**Formule :**

```
PRR = (Σ Interventions_Réalisées / Σ Interventions_Planifiées) × 100
```

- **Périmètre** : Par société, par marché, pour un mois donné.
- **Données source** : Table `interventions_preventives` (statut = `VALIDE`).
- **Règles** :
  - Si `Interventions_Planifiées = 0` → PRR = `N/A`.
  - PRR plafonné à 100% (le sur-accomplissement ne compense pas les mois déficitaires).
- **Exemple** : 18 réalisées / 20 planifiées = **90.0%**

### 4.3 Indicateur 2 : Disponibilité (D)

**Formule :**

```
D = ((T_fonctionnement_théorique - T_arrêt_cumulé) / T_fonctionnement_théorique) × 100
```

Où :
- `T_fonctionnement_théorique` = `heures_fonctionnement_jour × nombre_jours_du_mois` (par équipement).
- `T_arrêt_cumulé` = `Σ (t_reprise - t_panne)` pour toutes les pannes du mois (statut = `RESOLUE`).

- **Périmètre** : Par équipement, agrégeable par société/marché.
- **Règles** :
  - Les pannes non résolues (`t_reprise = NULL`) : l'arrêt court jusqu'à la fin de la période ou `NOW()`.
  - Disponibilité par société = moyenne pondérée des disponibilités de ses équipements.
- **Exemple** : Théorique = 720h, Arrêt = 18h → D = ((720-18)/720)×100 = **97.5%**

### 4.4 Indicateur 3 : MRT (Mean Reaction Time)

**Formule :**

```
MRT = Σ (T_arrivée - T_notification) / N_pannes_prises_en_charge
```

- **Périmètre** : Par société, pour un mois donné.
- **Unité** : Minutes.
- **Données source** : Table `reclamations` où `t_arrivee IS NOT NULL`.
- **Règles** :
  - Seules les réclamations avec `t_arrivee` renseigné comptent.
  - Si `N_pannes = 0` → MRT = `N/A`.
- **Conformité SLA** : `MRT ≤ marche.sla_mrt` → Conforme ✅, sinon Non-conforme ❌.
- **Exemple** : Total temps réaction = 240 min pour 4 pannes → MRT = **60 min**

### 4.5 Détection des Pénalités

Pour chaque KPI non conforme au SLA contractuel :

```
Si PRR < sla_prr → Pénalité PRR applicable
Si D < sla_disponibilite → Pénalité Disponibilité applicable
Si MRT > sla_mrt → Pénalité MRT applicable
```

Le système génère automatiquement une alerte et marque la non-conformité dans le rapport.

---

## 5. Module de Reporting et Exportation

### 5.1 Types de Rapports

| Type | Fréquence | Contenu |
|---|---|---|
| Rapport Mensuel | Fin de chaque mois | KPIs détaillés par société/marché |
| Synthèse Trimestrielle | Fin de trimestre | Tendances, comparatifs, recommandations |
| Rapport National | Sur demande | Consolidation tous aéroports (Super-Admin) |

### 5.2 Contenu du Rapport Mensuel

1. **En-tête** : Logo ONDA, nom de l'aéroport, période, date de génération.
2. **Récapitulatif des pannes** : Tableau listant chaque panne (équipement, durée, cause, impact).
3. **Détail des temps d'arrêt** : Chronologie des arrêts avec durées.
4. **Tableau de conformité KPIs** :

| KPI | Valeur Calculée | Seuil SLA | Statut | Pénalité |
|---|---|---|---|---|
| PRR | 88% | ≥ 90% | ❌ Non-conforme | Oui |
| Disponibilité | 96.2% | ≥ 95% | ✅ Conforme | Non |
| MRT | 45 min | ≤ 60 min | ✅ Conforme | Non |

5. **Détail des interventions préventives** : Planifié vs réalisé.
6. **Observations et commentaires** du Superviseur.

### 5.3 Formats d'Export

- **PDF** : Charte graphique ONDA (couleurs officielles, logo, mise en page normalisée). Généré via une librairie de templating (WeasyPrint ou Puppeteer).
- **Excel/CSV** : Données brutes tabulaires pour analyse complémentaire.

### 5.4 Notifications Automatiques

| Événement | Destinataire | Canal |
|---|---|---|
| Nouvelle panne critique | Superviseur + Société | Email |
| MRT dépassé (SLA) | Superviseur | Email + In-App |
| Rapport mensuel prêt | Superviseur | Email + In-App |
| Marché proche de l'expiration (30j) | Superviseur + Admin | Email |

---

## 6. Exigences Techniques & Schéma de Base de Données

### 6.1 Stack Technique

| Couche | Technologie | Justification |
|---|---|---|
| **Frontend** | Next.js 14+ (React) | SSR, routing, performance |
| **UI** | Shadcn/ui + Tailwind CSS | Composants accessibles, design system |
| **Backend API** | Next.js API Routes ou FastAPI (Python) | Flexibilité, performance |
| **ORM** | Prisma (JS) ou SQLAlchemy (Python) | Type-safety, migrations |
| **Base de données** | PostgreSQL 16+ | RLS, JSONB, robustesse |
| **Authentification** | NextAuth.js ou JWT custom | RBAC, sessions sécurisées |
| **Génération PDF** | Puppeteer / WeasyPrint | Rapports avec charte graphique |
| **Export Excel** | ExcelJS / openpyxl | Exports tabulaires |
| **File Storage** | MinIO / S3 | Pièces jointes |
| **Cache** | Redis | Sessions, calculs KPI |
| **Déploiement** | Docker + Docker Compose | Reproductibilité |
| **CI/CD** | GitHub Actions | Tests et déploiement automatisés |

### 6.2 Schéma Relationnel de la Base de Données

```sql
-- ============================================
-- TABLE: airports (Tenants)
-- ============================================
CREATE TABLE airports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_iata       VARCHAR(3) UNIQUE NOT NULL,
    code_oaci       VARCHAR(4) UNIQUE NOT NULL,
    nom             VARCHAR(255) NOT NULL,
    ville           VARCHAR(100) NOT NULL,
    region          VARCHAR(100),
    statut          VARCHAR(20) DEFAULT 'ACTIF',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN')),
    airport_id      UUID REFERENCES airports(id),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: marches (Contrats)
-- ============================================
CREATE TABLE marches (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airport_id              UUID NOT NULL REFERENCES airports(id),
    numero_marche           VARCHAR(50) NOT NULL,
    objet                   TEXT NOT NULL,
    type_maintenance        VARCHAR(20) CHECK (type_maintenance IN ('PREVENTIVE','CORRECTIVE','MIXTE')),
    sla_disponibilite       DECIMAL(5,2) NOT NULL,
    sla_prr                 DECIMAL(5,2) NOT NULL,
    sla_mrt                 INTEGER NOT NULL, -- en minutes
    date_debut              DATE NOT NULL,
    date_fin                DATE NOT NULL,
    montant_total           DECIMAL(15,2),
    penalite_par_infraction DECIMAL(10,2),
    statut                  VARCHAR(20) DEFAULT 'BROUILLON',
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW(),
    UNIQUE(airport_id, numero_marche)
);

-- ============================================
-- TABLE: societes (Prestataires)
-- ============================================
CREATE TABLE societes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airport_id              UUID NOT NULL REFERENCES airports(id),
    marche_id               UUID NOT NULL REFERENCES marches(id),
    raison_sociale          VARCHAR(255) NOT NULL,
    rc_number               VARCHAR(50) NOT NULL,
    ice                     VARCHAR(15) NOT NULL,
    adresse                 TEXT NOT NULL,
    telephone               VARCHAR(20) NOT NULL,
    email_contact           VARCHAR(255) NOT NULL,
    email_notification      VARCHAR(255) NOT NULL,
    contact_urgence_nom     VARCHAR(100) NOT NULL,
    contact_urgence_tel     VARCHAR(20) NOT NULL,
    created_at              TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: equipements
-- ============================================
CREATE TABLE equipements (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airport_id                  UUID NOT NULL REFERENCES airports(id),
    marche_id                   UUID NOT NULL REFERENCES marches(id),
    societe_id                  UUID NOT NULL REFERENCES societes(id),
    code_equipement             VARCHAR(50) NOT NULL,
    designation                 VARCHAR(255) NOT NULL,
    categorie                   VARCHAR(30) NOT NULL,
    localisation                VARCHAR(255) NOT NULL,
    criticite                   VARCHAR(20) DEFAULT 'STANDARD',
    date_mise_en_service        DATE,
    heures_fonctionnement_jour  DECIMAL(4,1) NOT NULL DEFAULT 24,
    statut                      VARCHAR(20) DEFAULT 'EN_SERVICE',
    created_at                  TIMESTAMP DEFAULT NOW(),
    UNIQUE(airport_id, code_equipement)
);

-- ============================================
-- TABLE: interventions_preventives
-- ============================================
CREATE TABLE interventions_preventives (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airport_id                  UUID NOT NULL REFERENCES airports(id),
    equipement_id               UUID NOT NULL REFERENCES equipements(id),
    mois                        DATE NOT NULL, -- Premier jour du mois
    nb_interventions_planifiees INTEGER NOT NULL,
    nb_interventions_realisees  INTEGER NOT NULL,
    observations                TEXT,
    saisi_par                   UUID REFERENCES users(id),
    valide_par                  UUID REFERENCES users(id),
    statut_validation           VARCHAR(20) DEFAULT 'EN_ATTENTE',
    created_at                  TIMESTAMP DEFAULT NOW(),
    UNIQUE(airport_id, equipement_id, mois)
);

-- ============================================
-- TABLE: pannes
-- ============================================
CREATE TABLE pannes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airport_id          UUID NOT NULL REFERENCES airports(id),
    equipement_id       UUID NOT NULL REFERENCES equipements(id),
    t_panne             TIMESTAMP NOT NULL,
    t_reprise           TIMESTAMP,
    duree_arret_minutes INTEGER GENERATED ALWAYS AS
        (EXTRACT(EPOCH FROM (t_reprise - t_panne)) / 60) STORED,
    cause_panne         VARCHAR(30) NOT NULL,
    description         TEXT NOT NULL,
    actions_correctives TEXT,
    impact              VARCHAR(20) NOT NULL,
    statut              VARCHAR(20) DEFAULT 'OUVERTE',
    saisi_par           UUID REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: reclamations (Réactivité)
-- ============================================
CREATE TABLE reclamations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airport_id              UUID NOT NULL REFERENCES airports(id),
    panne_id                UUID NOT NULL REFERENCES pannes(id),
    t_notification          TIMESTAMP NOT NULL,
    moyen_notification      VARCHAR(20) NOT NULL,
    t_arrivee               TIMESTAMP,
    temps_reaction_minutes  INTEGER GENERATED ALWAYS AS
        (EXTRACT(EPOCH FROM (t_arrivee - t_notification)) / 60) STORED,
    conforme_sla            BOOLEAN,
    commentaire             TEXT,
    saisi_par               UUID REFERENCES users(id),
    created_at              TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    airport_id  UUID REFERENCES airports(id),
    action      VARCHAR(50) NOT NULL,
    table_name  VARCHAR(50) NOT NULL,
    record_id   UUID,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: rapports_generes
-- ============================================
CREATE TABLE rapports_generes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airport_id      UUID NOT NULL REFERENCES airports(id),
    type_rapport    VARCHAR(20) NOT NULL,
    periode_debut   DATE NOT NULL,
    periode_fin     DATE NOT NULL,
    marche_id       UUID REFERENCES marches(id),
    societe_id      UUID REFERENCES societes(id),
    fichier_pdf_url VARCHAR(500),
    fichier_xlsx_url VARCHAR(500),
    genere_par      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (Multi-tenant isolation)
-- ============================================
ALTER TABLE marches ENABLE ROW LEVEL SECURITY;
ALTER TABLE societes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pannes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions_preventives ENABLE ROW LEVEL SECURITY;

-- Exemple de policy RLS
CREATE POLICY tenant_isolation ON marches
    USING (airport_id = current_setting('app.current_airport_id')::UUID);
```

### 6.3 Diagramme Entité-Relation

```
airports 1──────┬──────N marches
   │            │         │
   │            │     1───┤
   │            │         N
  1│            │      societes
   │            │         │
   N            │     1───┤
 users          │         N
                │     equipements
                │       │   │
                │    1──┤   ├──1
                │       N   N
                │    pannes  interventions_preventives
                │       │
                │    1──┤
                │       N
                │   reclamations
                │
                └──────N rapports_generes
```

### 6.4 Index Recommandés

```sql
CREATE INDEX idx_marches_airport ON marches(airport_id);
CREATE INDEX idx_equipements_airport ON equipements(airport_id);
CREATE INDEX idx_equipements_societe ON equipements(societe_id);
CREATE INDEX idx_pannes_airport_date ON pannes(airport_id, t_panne);
CREATE INDEX idx_pannes_equipement ON pannes(equipement_id);
CREATE INDEX idx_reclamations_panne ON reclamations(panne_id);
CREATE INDEX idx_interventions_mois ON interventions_preventives(airport_id, mois);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
```

### 6.5 Exigences Non-Fonctionnelles

| Exigence | Cible |
|---|---|
| Temps de réponse API | < 500ms (p95) |
| Disponibilité système | 99.5% |
| Sauvegarde BDD | Quotidienne, rétention 30 jours |
| Langues | Français (principal), Arabe (optionnel) |
| Responsive | Desktop prioritaire, tablette supporté |
| Navigateurs | Chrome, Firefox, Edge (dernières versions) |
| Conformité | RGPD-like (protection données personnelles) |
