# A DJAL administration

Standalone React/Vite back-office.

- Install with `pnpm install`.
- In local development, the API defaults to `http://localhost:8099`; set
  `VITE_API_BASE_URL` to another API origin when needed, without the `/api`
  suffix.
- Run with `pnpm run dev`; build with `pnpm run build`.
- The generated client comes from the published `@adjal/api-contract` package.

The administrator uses the same Spring API and MySQL database as the buyer and
farmer applications. Sign in with the initial account created by the backend:
`admin@adjal.cm` / `admin123`.
