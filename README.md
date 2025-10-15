# ObtAIn

## Build Commands

Install dependencies: `npm i`

Run the dev server: `npm run dev`

Preview a production build: `npm run preview`

Build and deploy to production with Wrangler: WIP

### Enviornment Variables

See file `.env`, fill out `SECRET_OPENAI_API_KEY` as necessary, it may be filled in already.

## Developing

### Project Structure

```
src/
├── lib/                      # Core libraries & shared utilities
│   ├── assets/               # Static assets (images, fonts, etc.)
│   ├── server/               # Server-side wrappers & helpers
│   ├── types/                # Globally-used TypeScript types
│   └── ui/                   # UI and display components
│
├── routes/                   # Application routes
│   ├── api/
│   │   └── v1/
│   │       └── chat/         # Endpoints for AI chat
│   └── ...                   # Other routes
│
└── ...                       # Svelte-generated global layouts and styles
```

### Workflow

Please make a new branch with `git checkout -b branch-name` when working on anything.
PRs will be reviewed within 48 hours.
