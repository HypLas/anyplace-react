# Any'place — React + Tailwind CSS + Firebase

## Stack
- **React 18** + React Router v6 (SPA)
- **Tailwind CSS v3** avec palette personnalisée rouge/or/noir
- **Firebase** (Auth + Firestore + Hosting)
- **Vite** (bundler, dev server, build)

## Commandes
```bash
npm install          # Installer les dépendances
npm run dev          # Serveur de développement (localhost:5173)
npm run build        # Build de production → dossier dist/
firebase deploy      # Déployer sur Firebase Hosting
```

## Structure
```
src/
├── firebase.js              # Config Firebase (npm, plus de CDN)
├── constants/index.js       # Genres, langues, plateformes, utils
├── context/AuthContext.jsx  # Auth globale via useContext
├── components/
│   ├── Navbar.jsx
│   └── Footer.jsx
└── pages/
    ├── Home.jsx
    ├── Login.jsx
    ├── Catalogue/
    │   ├── index.jsx        # Grille + filtres + mode suppression
    │   ├── AnimeCard.jsx    # Carte anime
    │   ├── AddEditModal.jsx # Modal 3 onglets ajout/édition
    │   ├── DetailModal.jsx  # Bannière + stats + épisodes
    │   └── EpisodeSection.jsx # Sidenav + tableaux éditables
    └── Anime/
        └── index.jsx        # Liste perso + suivi épisodes
```

## Déploiement Firebase
firebase.json pointe vers `dist/` avec SPA rewrite (`**` → `/index.html`).
