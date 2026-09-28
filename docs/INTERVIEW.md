# Présenter PulseOps en entretien

Ce guide t'aide à expliquer le code. Adapte les formulations à ce que tu as réellement compris et modifié. Ne présente pas une intégration externe ou un test comme exécuté s'il ne l'a pas été.

## Elevator pitch — 30 secondes

« PulseOps est un centre d'opérations de sécurité construit avec Next.js, TypeScript et PostgreSQL. Il transforme des événements fictifs en alertes explicables, puis permet à un analyste de suivre une investigation jusqu'à sa résolution. J'ai travaillé les permissions côté serveur, les transactions, la conservation des preuves et le temps réel avec SSE. L'assistant d'analyse fournit un résultat structuré et validé ; cette version utilise une analyse locale de démonstration. Mon objectif était de construire un produit cohérent que je peux maintenir seul et expliquer de bout en bout. »

## Démonstration en cinq minutes

1. Connexion : « Le compte démo passe par la vraie authentification et possède le rôle analyste. »
2. Dashboard : montrer le score et dire comment il est calculé. Ce n'est pas un indicateur de sécurité certifié.
3. Alerte critique : relier le succès d'authentification aux dix échecs précédents. Montrer les preuves dans la timeline.
4. Analyse : indiquer le badge DEMO, les références vérifiées et les limites de la confiance.
5. Incident : changer le statut, ajouter une note et recharger pour prouver la persistance.
6. Live events : pause/reprise. Expliquer que le simulateur écrit et que SSE lit.

## “Why did you choose Next.js?”

Un seul langage et un seul déploiement réduisent la charge d'un projet solo. Les Server Components chargent les données sans envoyer toute la logique serveur au navigateur. Les Server Actions servent les mutations de l'interface ; les Route Handlers servent Auth.js, SSE et les API. Ce n'est pas une obligation universelle : un service séparé serait utile pour un moteur Python spécialisé ou un ingest à très fort débit.

## “Why PostgreSQL?”

Les données sont fortement liées : alertes, événements, incidents, acteurs, commentaires et audits. Les transactions garantissent qu'une conversion d'alerte crée le dossier, lie les preuves et écrit l'audit ensemble. Les contraintes uniques protègent contre les doublons. PostgreSQL fournit aussi les verrous nécessaires à la coordination du simulateur.

## “Why Prisma?”

Le schéma décrit les relations et produit un client typé. Les migrations rendent l'évolution reproductible. Je garde néanmoins la compréhension SQL : indexes, transactions, pagination et verrous ne sont pas automatiquement bien conçus parce qu'on utilise un ORM. Quelques verrous sont écrits en SQL paramétré.

## “How does authentication work?”

Auth.js vérifie des identifiants validés par Zod. Les mots de passe sont hashés avec Argon2id. La session est portée par un cookie HttpOnly géré par Auth.js, avec expiration de quatre heures. À chaque accès protégé, le serveur relit l'utilisateur et sa version de session. Je n'enregistre aucun token dans localStorage. La version Auth.js est une beta verrouillée ; c'est une limite à connaître.

## “How does RBAC work?”

ADMIN gère l'organisation et les rôles ; ANALYST analyse et modifie les investigations ; VIEWER lit. Cacher un bouton améliore l'UX, mais le vrai contrôle est dans `requireActor`, puis dans la transaction de mutation. Même un appel direct au service d'écriture échoue pour un lecteur. Un changement de rôle invalide les sessions existantes.

## “How does real-time work?”

EventSource ouvre une connexion SSE unidirectionnelle. Le serveur lit les événements après une séquence monotone et renvoie des messages nommés. À la reconnexion, Last-Event-ID évite de repartir de zéro. Une connexion dure au plus 24 secondes pour rester compatible avec un environnement serverless. Le navigateur garde 200 événements au maximum et recharge les derniers après une longue interruption. Les compteurs du dashboard sont un instantané, pas un flux continu.

## “How are alerts generated?”

Un moteur pur évalue les fenêtres d'événements : cinq échecs par utilisateur, quinze par IP, ou un succès inhabituel après dix échecs. Il retourne une règle, un niveau et les IDs des preuves. L'orchestrateur insère le résultat dans une transaction et déduplique les occurrences pendant cinq minutes. Un scénario de seed emprunte ce même chemin pour éviter d'inventer des alertes sans événements associés.

## “How would you scale this application?”

D'abord mesurer : volume d'ingestion, latence des requêtes, taille des tables et connexions SSE. Ensuite séparer ingestion et lecture, partitionner les événements, remplacer le verrou global par une coordination par sujet et ajouter une queue durable. Les abonnés SSE pourraient recevoir du pub/sub plutôt que faire chacun des lectures périodiques. Pour la recherche, utiliser les index plein texte/trigrammes. Je n'ajouterais pas Kafka ou des microservices avant de mesurer un besoin.

## “What security considerations did you make?”

Permissions côté serveur, revalidation dans les transactions, Zod, hash de mot de passe, cookies protégés, limites de tentatives, contrôle des origines, CSP à nonce et absence de secrets versionnés. Le contexte prévu pour un futur modèle externe retire les identifiants et rejette les données non fictives. Il n'y a aucune exécution de commande issue d'une analyse. Limites : pas de MFA, pas de multi-tenant et audit modifiable par un administrateur DB.

## “What would you improve with more time?”

Un fournisseur d'identité avec MFA, un connecteur IA autorisé et évalué, des tests de charge PostgreSQL, une ingestion durable, une rétention configurable, un audit exportable et des tests d'accessibilité automatisés. Je voudrais aussi permettre de relier plusieurs alertes à un incident depuis l'interface et améliorer les scénarios de simulation.

## Questions difficiles à préparer

**Pourquoi pas WebSocket ?** Le besoin principal est serveur → navigateur ; SSE fournit déjà reconnexion et IDs avec moins de protocole à maintenir.

**Pourquoi deux dates sur un événement ?** L'occurrence décrit le fait observé ; l'ingestion décrit sa réception. Une arrivée tardive ne doit pas être confondue avec l'heure du fait. Cette V1 ne reconstruit pas rétrospectivement toutes les anciennes fenêtres.

**Deux analystes changent le même statut ?** Chaque mise à jour inclut la version lue ; la deuxième échoue si la première a déjà modifié la ligne. L'interface demande de rafraîchir.

**L'analyse est-elle une vraie IA ?** La version livrée utilise un analyste déterministe DEMO. Elle montre le contrat structuré, la validation et la conservation des preuves. Je ne prétends pas qu'un modèle distant a été appelé.

**Qu'as-tu testé ?** Consulter `VALIDATION.md`, puis montrer un test de seuil, un test de refus VIEWER et le test de transaction. Expliquer la différence entre un test écrit, un test réellement passé et un parcours vérifié manuellement.

## Pour maîtriser le projet avant de l'envoyer

Retrace une alerte depuis `generator.ts` jusqu'à `rules.ts`, puis `ingest.ts`, et enfin sa page React. Modifie un seuil dans une branche et observe quel test échoue. Explique chaque colonne importante du modèle. Refais le parcours VIEWER. Construis toi-même un petit changement et son test : c'est plus convaincant que mémoriser des réponses.
