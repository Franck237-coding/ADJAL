# A DJAL mobile

Standalone Expo client for buyers and farmers.

- Install with `pnpm install`.
- Run the web/dev preview with `pnpm run dev`.
- Set `EXPO_PUBLIC_API_URL` to the complete API base including `/api`.
- Native sessions use SecureStore; the web preview uses tab-scoped session storage.
- The static Expo Go build additionally requires `EXPO_PUBLIC_DOMAIN` to be set
  to the public HTTPS domain where the generated files will be served.
