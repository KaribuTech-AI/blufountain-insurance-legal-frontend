# Blufountain client (public portal)

React + Vite, port 5174. Requires Node.js 24+. Proxies `/api` to the backend at localhost:3000 (run **blufountain-backend**).

```sh
npm install            # also builds packages/domain
npm run dev
npm test
```

The build fails if first-visit JS exceeds the budget in `package.json` (`scripts/check-budget.mjs`).

Shared packages live in `packages/` as workspaces. `domain` and `ui` are copies of the same code kept in the other frontend and the backend; keep them in step when changing.
