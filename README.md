# Global Markets Platform

An India-first financial markets web application built with Next.js and designed for static deployment on GitHub Pages.

## MVP 1

The current interface includes:

- Premium NSE/BSE market dashboard
- NIFTY 50, SENSEX, BANK NIFTY and NIFTY IT overview
- Indian equities table
- NSE/BSE filtering
- Sector filtering
- Stock search
- Top gainers and losers
- Responsive desktop/mobile layout
- GitHub Pages deployment workflow

> The first interface uses sample market values. A licensed real-time market data source will be connected in the next phase.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
```

Next.js exports the static website to `out/`.

## GitHub Pages

A deployment workflow is included at:

`.github/workflows/deploy-pages.yml`

In the repository, go to:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

After Pages is enabled, pushes to `main` will deploy the site automatically.

## Next phase

1. Connect licensed live NSE/BSE market data.
2. Replace preview values with real quotes.
3. Add individual stock pages and charts.
4. Add watchlists.
5. Expand to global markets.
