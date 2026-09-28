# PulseOps — plan de réalisation

Les phases 1 et 2 ont produit des documents de conception. Les phases 3 à 16 restent à implémenter. Aucun code, test, déploiement ou historique Git n'est présenté comme déjà réalisé.

## Phases et critères de sortie

| Phase | Réalisation | Critère de sortie |
| --- | --- | --- |
| 1 — Besoin | Personas, scénario recruteur, exigences, hypothèses, MVP/V1/V2, limites défensives | REQUIREMENTS.md couvre le brief et définit les métriques |
| 2 — Architecture | Modules, routes, modèle relationnel, permissions, transactions, SSE, IA, risques | ARCHITECTURE.md et DATA_MODEL.md cohérents avec les critères |
| 3 — Initialisation | Next.js/React/TS strict, Tailwind/shadcn, lint/format, Vitest, scripts, Git, .gitignore, .env.example, shell minimal | Installation verrouillée, typecheck/lint, premier test pertinent et build |
| 4 — DB | Prisma, PostgreSQL, enums/relations/index, migration initiale, seed réaliste et reproductible | Prisma validate, migration sur base vide, seed idempotent, contraintes testées |
| 5 — Auth/RBAC | Login, demo, erreurs/loading, hash, JWT, guards serveur, rate limit, audit de connexion | Connexions valides/invalides, permissions 3 rôles, révocation et refus d'accès direct |
| 6 — Simulateur | Générateur pondéré, scénarios, horloge, ingestion idempotente, script et tick demo | Données validées, aucune activité réseau offensive, cadence et doublons testés |
| 7 — Détection | Fonctions pures, fenêtres, preuves, déduplication, orchestration transactionnelle | Seuils, fenêtres, corrélation critique, retries et courses testés |
| 8 — Dashboard | Score réel, compteurs, séries, carte, shell responsive, données serveur | Chiffres vérifiés contre DB, légendes/périodes, empty/loading/error states |
| 9 — Investigation | Alertes/filtres/tri/pages, détail/timeline, incidents/commentaires, profils/assets et recherche de base ; audit et notifications | Cycle persistant, transactions, conflits et droits vérifiés |
| 10 — Temps réel | SSE, pause/reprise, replay, recherche/filtres, statut de connexion, tick Vercel borné | Déconnexion/reconnexion sans doublons, session révoquée, tampon et quotas bornés |
| 11 — IA | Contexte, prompt, fournisseur optionnel, parsing/Zod, vérification de preuves, timeout, fallback, persistance | Succès, absence de clé, panne et réponse malformée couverts |
| 12 — Tests | Compléter les tests existants et E2E login → alerte → investigation → incident | Unitaires, intégration PostgreSQL, UI et parcours principal passent |
| 13 — Docker | Image multi-stage non-root, Compose, DB/healthchecks, migration, seed demo contrôlé et simulateur | Démarrage depuis environnement vierge, persistance et redémarrage vérifiés |
| 14 — CI/CD | GitHub Actions PR, installation verrouillée, lint/typecheck/tests/build/E2E ; préparation Vercel | Workflow vérifié, séparation preview/prod, secrets et migrations documentés |
| 15 — UX/UI | Finition dashboard/détails/carte, toutes pages secondaires, settings, audit UI, notifications, palette, thèmes et recruiter mode | Toutes exigences V1 couvertes ; parcours clavier, desktop/mobile et erreurs réseau vérifiés |
| 16 — GitHub | README, captures réelles, architecture mise à jour, INTERVIEW.md, LICENSE, CONTRIBUTING, procédure de déploiement | Aucune fonctionnalité sur-vendue, liens valides, installation relue et reproductible |

Les tests démarrent avec le code, pas uniquement en phase 12. Le seed de phase 4 contient les fixtures nécessaires ; sa génération d'alertes est alignée sur le moteur dès la phase 7. La phase 15 termine les interfaces secondaires déjà soutenues par les services, elle ne masque pas des fonctionnalités non faites.

## Contrôles à chaque phase

À partir de la phase 3 : typecheck, ESLint et tests existants pertinents. Rejouer ces contrôles après correction. Build aux jalons UI/auth, avant Docker, en CI et à la livraison. Les tests d'intégration emploient PostgreSQL et une base isolée ; un mock Prisma ne suffit pas à valider une transaction.

Un contrôle impossible est rapporté comme non exécuté avec sa cause, jamais comme réussi. Les phases documentaires utilisent une vérification de fichiers, liens, couverture et cohérence. TypeScript/lint/tests applicatifs sont non applicables tant qu'aucune application n'est initialisée.

## Jalons

- **Socle :** fin phase 7, événements persistés et alertes explicables.
- **MVP :** fin phase 11 avec les tests écrits progressivement ; parcours complet utilisable.
- **V1 portfolio :** fin phase 16, toutes exigences obligatoires livrées et vérifiées.
- **V2 :** améliorations listées dans REQUIREMENTS.md, seulement après V1.

## Séquence de commits proposée

Créer les commits au fur et à mesure des changements réels. Ne pas reconstituer un faux historique a posteriori et ne pas publier une PR ou un dépôt comme s'ils existaient déjà.

```text
docs: define PulseOps scope and architecture
chore: initialize Next.js application and quality tooling
feat: add PostgreSQL schema and reproducible seed
feat: implement authentication and server authorization
feat: add safe security event simulator
feat: implement evidence-based detection rules
feat: build SOC dashboard and simulated threat map
feat: add alert triage and investigation details
feat: implement incident workflow and audit trail
feat: add monitored identities assets and investigation search
feat: stream persisted security events with SSE
feat: add validated AI analysis and demo fallback
test: cover investigation workflow and authorization failures
build: add reproducible Docker environment
ci: validate pull requests and prepare deployment
feat: add recruiter tour command palette and preferences
fix: refine responsive behavior and accessibility
docs: add screenshots setup and interview guide
```

## README final requis

Titre/tagline, capture principale, badges de stack et statut CI vérifiable, Live Demo (URL réelle ou indisponibilité explicite), Overview, Features, Architecture avec Mermaid, Tech Stack, Security Detection Engine, AI Analysis, Screenshots, Getting Started, Environment Variables, Running with Docker, Tests, Project Structure, Roadmap, What I Learned et Disclaimer.

« What I Learned » décrit les apprentissages que le développeur peut réellement expliquer ; pas d'expériences professionnelles inventées. Le README initial est volontairement honnête sur le stade du projet.

## Guide d'entretien à produire

`docs/INTERVIEW.md` contiendra un pitch de 30 secondes, un parcours de démonstration et des réponses reliées au code réellement livré :

- Why did you choose Next.js?
- Why PostgreSQL?
- Why Prisma?
- How does authentication work?
- How does RBAC work?
- How does real-time work?
- How are alerts generated?
- How would you scale this application?
- What security considerations did you make?
- What would you improve with more time?

Chaque réponse comprend choix, compromis et exemple vérifiable. La montée en charge explique les limites du monolithe, du polling SSE et du verrou global avant de proposer queue ou diffusion dédiée.

## Déploiement à documenter et vérifier

Vercel pour Next.js, PostgreSQL distant compatible avec pooling, secrets configurés côté serveur, commandes de build et migrations explicites. Base de preview séparée. Version Node compatible et dépendances verrouillées. Pas de seed destructif, pas de migration automatique exécutée simultanément par toutes les previews.

Le mode Vercel génère en présence d'un visiteur, le mode Docker en continu. Vérifier limites du plan, délais SSE/IA, reconnexion, connexion DB et budgets avant d'afficher une URL de démo. Un déploiement live n'est pas encore réalisé.

## État réel après phases 1 et 2

- Réalisé : cadrage, architecture, modèle conceptuel, routes, politiques, risques et roadmap.
- Non réalisé : initialisation Next.js/Git, DB exécutable, UI, authentification, simulation, IA, Docker et workflows.
- Contrôles applicatifs : non applicables pour l'instant.
- Prochaine étape définie : phase 3, initialisation et premier socle exécutable.
