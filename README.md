# Rate Limit Configurator UI

## Overview

The Rate Limit Configurator UI is a web application built using the Astro Web Framework. It provides a user-friendly interface for managing rate limiting rules that are applied by a separate Rate Limiting Worker. The UI allows users to create, edit, delete, and reorder rate limiting rules, which are stored in a Durable Object bound to the UI worker.

## Project Structure

```
rate-limiter-configurator/
├── src/
│   ├── components/
│   │   ├── ActionFields.tsx
│   │   ├── add-rule-button.tsx
│   │   ├── BasicInfoTab.tsx
│   │   ├── ConditionRenderer.tsx
│   │   ├── ExpressionTab.tsx
│   │   ├── FingerprintTab.tsx
│   │   ├── RateLimitConfigurator.tsx
│   │   ├── RateLimitRuleManager.tsx
│   │   ├── RateLimitTab.tsx
│   │   ├── rule-configurator-dialog.tsx
│   │   ├── rule-list.tsx
│   │   ├── RuleLogicTab.tsx
│   │   ├── sortable-item.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── time-display.tsx
│   │   ├── version-history-dialog.tsx
│   │   └── VersionHistoryTab.tsx
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   ├── store/
│   │   └── ruleStore.ts
│   ├── styles/
│   │   └── global.css
│   └── types/
│       └── ruleTypes.ts
├── public/
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
├── tsconfig.json
└── wrangler.toml
```

## Key Components

1. **RateLimitRuleManager**: The main component that manages the list of rules and handles CRUD operations.
2. **RateLimitConfigurator**: Handles the configuration of individual rules, including basic info, rate limit settings, fingerprint configuration, and rule logic.
3. **RuleList**: Displays the list of rules and allows for reordering.
4. **ThemeToggle**: Allows switching between light and dark themes.

## State Management

The application uses Zustand for state management. The `ruleStore.ts` file contains the store definition with actions for fetching, adding, updating, deleting, and reordering rules.

## API Endpoints

The UI interacts with the following API endpoints:

- `GET /api/config`: Fetch all rules
- `POST /api/config`: Add a new rule
- `PUT /api/config/rules/:id`: Update an existing rule
- `DELETE /api/config/rules/:id`: Delete a rule
- `PUT /api/config/reorder`: Reorder rules
- `PUT /api/config/rules/:id/revert`: Revert a rule to a previous version
- `GET /api/config/rules/:id/versions`: Get version history for a rule

These endpoints are handled by the Durable Object bound to the UI worker.

## Durable Object Integration

The UI worker has a binding to a Durable Object named `CONFIG_STORAGE`. This object is responsible for storing and managing the rate limiting rules. The Durable Object provides persistence and consistency for the rule configurations.

## Deployment

The project is configured to be deployed as a Cloudflare Pages project. The `wrangler.toml` file contains the necessary configuration for the Durable Object binding and other deployment settings.

## Development

To run the project locally:

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`

To build the project for production:

```
npm run build
```

To preview the production build:

```
npm run preview
```

## Technologies Used

- Astro
- React
- Tailwind CSS
- Zustand
- dnd-kit (for drag-and-drop functionality)
- Cloudflare Workers and Durable Objects

## Note on Security

Ensure that proper authentication and authorization mechanisms are in place to protect the rate limit configuration API endpoints. The current implementation does not include built-in security measures.
