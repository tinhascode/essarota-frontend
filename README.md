# EssaRota — App

App mobile (Expo SDK 57 + Expo Router) para planejar trajetos do dia a dia. Consome a API descrita em [`docs/backend_doc.md`](docs/backend_doc.md).

## Como rodar

1. Instale as dependências

   ```bash
   npm install
   ```

2. Configure a URL da API copiando `.env.example` para `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   - Web / simulador iOS: `http://localhost:8080/api/v1`
   - Emulador Android: `http://10.0.2.2:8080/api/v1`
   - Celular físico (Expo Go): `http://<IP-da-sua-máquina>:8080/api/v1`

3. Inicie o app

   ```bash
   npx expo start
   ```

## Estrutura

- `src/app/(auth)` — login e cadastro (rotas públicas).
- `src/app/(app)` — abas autenticadas: mapa (`index`) e meus trajetos.
- `src/components/map` — mapa OpenStreetMap/Leaflet (WebView no nativo, iframe na web).
- `src/services` — cliente HTTP com JWT, serviços da API e geocodificação (Nominatim).
- `src/providers` — sessão (`AuthProvider`) e tema claro/escuro (`AppThemeProvider`).
- `src/constants/theme.ts` — paleta da marca (roxo/índigo + verde) para os dois temas.

## Antes de abrir PR

```bash
npx expo lint
npx tsc --noEmit
```
