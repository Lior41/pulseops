# PulseOps — cadrage produit

Statut : phase 1 terminée, contrat de réalisation. Les fonctionnalités décrites sont prévues, pas encore implémentées.

## Objectif

Construire un portfolio professionnel démontrant une chaîne complète : événement simulé → détection déterministe → alerte justifiée → investigation → analyse IA structurée → incident → résolution auditée.

Un recruteur doit pouvoir suivre une preuve de l'écran jusqu'à sa ligne en base et comprendre le code correspondant. La profondeur de cette chaîne prime sur le nombre de cartes du dashboard.

## Hypothèses retenues

- Une organisation fictive par installation ; pas de multi-tenant en V1.
- Interface et README final en anglais ; documents pédagogiques en français.
- Comptes SOC distincts des personnes surveillées.
- Authentification email/mot de passe sans inscription publique.
- Démo publique avec rôle ANALYST ; ADMIN réservé au local ou à un compte privé.
- Démo partagée : les changements des visiteurs sont communs, limite affichée dans l'interface.
- Aucune clé IA nécessaire pour le parcours de démonstration.
- Données uniquement fictives et mention « Demo / simulated telemetry ».
- Volume modeste, développement seul, aucune prétention à remplacer un SIEM de production.

## Parcours principal accepté

1. Ouvrir `/login`, utiliser « Try demo account » et se connecter par le mécanisme normal.
2. Voir des compteurs calculés depuis PostgreSQL avec périodes et fraîcheur des données.
3. Ouvrir une alerte critique, identifier sa règle, ses preuves et sa timeline.
4. Obtenir une analyse structurée et validée ; distinguer clairement IA distante, simulation et fallback.
5. Marquer l'alerte INVESTIGATING ; constater la persistance après rechargement et l'audit.
6. Créer un incident associé ; un double clic ou retry ne crée pas de doublon.
7. Ajouter un commentaire et résoudre l'incident ; retrouver ces actions dans la timeline.
8. Observer un événement enregistré par le serveur arriver via SSE, puis tester pause/reprise et filtres.

Un VIEWER doit échouer à modifier une alerte même en appelant directement le serveur.

## MVP, V1 complète et V2

Le MVP est une livraison intermédiaire. Il ne supprime aucune exigence obligatoire du projet final.

| Livraison | Périmètre |
| --- | --- |
| MVP | Login/demo, RBAC, DB/seed, simulateur, règles, dashboard/carte, alertes et détails, incidents/commentaires, SSE, IA structurée, audits et tests du parcours |
| V1 portfolio | MVP + profils surveillés/assets, recherche, palette, notifications, settings, audit UI, mode recruteur, finition accessible/responsive, Docker, CI/CD, documentation, captures et préparation Vercel |
| V2 | OIDC/MFA, multi-tenant, démos isolées par visiteur, connecteurs défensifs réels, règles éditables, recherche avancée, queue/diffusion distribuée si nécessaire, rétention et rapports |

## Exigences traçables

| Domaine | Livraison attendue | Phases |
| --- | --- | --- |
| Login | Email/password, validation, erreurs, loading, demo ; pas de remember me sans politique réelle | 5, 15 |
| Dashboard | Score/delta, menaces actives, alertes critiques, événements du jour, personnes, endpoints ; séries incidents 24 h/7 j, catégories, sévérité et score | 8 |
| Threat map | Pays, nombre, niveau, position synthétique, légende, interaction clavier et alternative tabulaire | 8, 15 |
| Feed | SSE, pause/reprise, filtres/recherche, reconnexion et état du flux | 10 |
| Alertes | Severity, title, user, IP, country, date, status ; filtres severity/status/country/date/category, recherche, pagination et tri | 9 |
| Détail | Description, source, personne, IP, pays, device, historique et timeline probante | 9 |
| IA | Prompt, parsing/Zod, preuve référencée, loading, timeout, erreur et fallback étiqueté | 11 |
| Incidents | ID, titre, sévérité, owner, statut, dates, description, événements, commentaires et timeline | 9 |
| Personnes | Département, dernière connexion/pays, incidents, risque ; historique, devices, IP, pays, alertes et authentifications | 9, 15 |
| Assets | Hostname, OS, statut, IP, last seen, propriétaire et risque | 9, 15 |
| Recherche | Email, nom, IP, événement, incident, hostname ; groupes, résultats et compteurs | 9, 15 |
| Palette | Cmd/Ctrl+K, navigation, recherche, création d'incident et thème selon permissions | 15 |
| Notifications | Badge, lecture, alertes critiques, attribution/résolution, baisse du score | 9, 10, 15 |
| Audit | Connexion, alerte modifiée/résolue, incident créé/résolu, rôle modifié ; acteur/action/ressource/date/IP disponible | 5, 9, 15 |
| Settings | General, Security, Users, Notifications, Integrations ; préférences et rôles persistés, connecteurs DEMO | 15 |
| Recruiter demo | Dashboard → alerte critique → IA → incident → feed, avec vraies ressources | 15 |
| Livraison | Tests, Docker, GitHub Actions, Git, captures, README, architecture, entretien, déploiement documenté | 12–16 |

## Données et métriques

Seed cible : environ 12 000 événements sur sept jours, 120 personnes fictives, 60 assets, 40 alertes et 8 incidents. Le nombre exact d'alertes provient des scénarios et du moteur. Les volumes sont réduisibles pour les tests.

Graine pseudo-aléatoire et horloge injectables ; horloge figée dans les tests. Noms et entreprises crédibles mais fictifs. IP externes réservées à la documentation et IP internes privées. Pays et positions sont synthétiques, indépendants de l'IP et jamais présentés comme une géolocalisation réelle.

Un scénario garanti relie les échecs d'authentification, un succès depuis un pays inhabituel et une activité privilégiée.

- Active threats : alertes OPEN ou INVESTIGATING ; le détail explique ce proxy.
- Critical alerts : alertes CRITICAL actives, pas un nombre d'attaques prouvées.
- Events today : événements depuis minuit UTC, période affichée.
- Users monitored : MonitoredIdentity actives, distinctes des comptes SOC.
- Endpoints : assets inventoriés, avec statut séparé.
- Security score : indicateur pédagogique calculé/versionné, pas une certification.
- Incidents sur 24 h/7 j : incidents effectivement créés, pas événements renommés.

## Direction visuelle

Fond charbon, surfaces graphite, bordures fines, accent bleu froid pour les actions. Orange/rouge réservés aux menaces et erreurs ; vert discret pour les états sains. Chaque niveau possède un libellé, pas seulement une couleur.

Dashboard centré sur priorités, carte et investigations récentes. Détails centrés sur preuves, horaires et décisions. Carte sans faux arcs d'attaques mondiales. Navigation latérale desktop et compacte mobile, colonnes prioritaires et défilement local maîtrisé. Sans serif pour le contenu, monospace pour IDs/IP/timestamps. Animations brèves respectant reduced motion.

## Définition de terminé

- Comportement observable, persistant si requis, protégé côté serveur.
- États loading, vide, erreur, refus et succès adaptés ; navigation clavier.
- Validation des entrées et tests des invariants pertinents.
- Typecheck, lint et tests existants réussis à chaque phase de code ; build aux jalons et en CI.
- Phases sans code : contrôle documentaire, aucune commande applicative déclarée exécutée.
- Capture issue de l'application réelle, documentation alignée sur le fonctionnement réel.
- Simulation et intégration absente signalées, aucun bouton décoratif inactif inexpliqué.

## Hors périmètre

Aucune attaque, exploitation, récupération de secrets, exécution de malware, scan de cible ou intervention sur une machine réelle. Les recommandations IA ne suspendent pas de session externe et ne réinitialisent aucun mot de passe réel.
