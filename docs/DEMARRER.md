# Démarrer PulseOps sur ton Mac

1. Installe Node.js 24 LTS si nécessaire.
2. Dans le dossier du projet, ouvre `START.command`, ou lance `npm ci` puis `npm run demo` dans un terminal.
3. Attends le message Ready. Ouvre http://localhost:3000/login et clique sur **Try demo account**.
4. Garde le terminal ouvert pendant la démonstration. Pour arrêter, utilise `Ctrl+C`.

Le premier démarrage crée la configuration locale, initialise la base avec des données fictives et compile le produit. Les démarrages suivants préservent tes notes et incidents. Si le port 3000 est déjà utilisé, arrête l'ancienne instance avant d'en lancer une autre.

## Parcours conseillé

Dashboard → alerte critique → Analyze with AI → Create incident → Add note → Live events.

L'analyse est marquée DEMO : elle est structurée et enregistrée, mais aucun fournisseur IA externe n'est appelé. Les utilisateurs surveillés, machines, lieux et événements sont tous fictifs.

## Pour préparer un entretien

Lis ARCHITECTURE.md, puis INTERVIEW.md. Rejoue toi-même le parcours et ouvre le test de détection. Le dépôt est local et prêt à être publié après vérification des limites indiquées dans VALIDATION.md ; aucun compte GitHub ni déploiement Vercel n'a été créé à ta place.
