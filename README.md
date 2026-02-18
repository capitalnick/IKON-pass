# Ikon Pass 25/26 Resort Map

Interactive map of all 97 Ikon Pass ski resorts for the 2025/26 season. Built with Next.js, Felt, and Tailwind CSS.

Resort points are colour-coded by **Color Group** (15 regional groups), with distinct visual treatment for **New 25/26** additions. A sidebar provides filtering by region, color group, pass type, and new resort status.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Felt** (interactive map via JS SDK + REST API)
- **Tailwind CSS v4** (dark theme)
- **Vercel** (deployment)

## Setup

### Prerequisites

- Node.js 18+
- A [Felt](https://felt.com) account with API access
- A Felt API token (Settings → Integrations → API Tokens)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/ikon-pass-map.git
cd ikon-pass-map
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Felt API token:

```
FELT_API_TOKEN=your_felt_api_token_here
```

### 3. Create the Felt map

Run the setup script to create a Felt map and populate it with all 97 resort markers:

```bash
npm run setup:map
```

This will:
- Create a new Felt map with a dark basemap
- Add all 97 resorts as colour-coded map elements
- Output the map ID and URL

Copy the map ID from the output and add it to `.env.local`:

```
NEXT_PUBLIC_FELT_MAP_ID=the_map_id_from_output
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment on Vercel

### Option A: Via Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the `ikon-pass-map` repository
4. Add environment variable: `NEXT_PUBLIC_FELT_MAP_ID` = your map ID
5. Click **Deploy**

### Option B: Via Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

When prompted, add the environment variable `NEXT_PUBLIC_FELT_MAP_ID`.

> **Note:** `FELT_API_TOKEN` is only needed for the setup script (local-only). You do **not** need to add it to Vercel. Only `NEXT_PUBLIC_FELT_MAP_ID` is required for the deployed app.

## Data

Resort data is sourced from `IKON_Pass_25-26_Full_v2.csv` and baked into `src/data/resorts.ts` as a static TypeScript file. 97 resorts across 15 Color Groups and 6 Macro Regions.

### Color Groups

| Group | Color |
|-------|-------|
| Alps - France/Andorra | #4361EE |
| Alps - Switzerland/Austria | #E63946 |
| Alps - Italy (Dolomites) | #2EC4B6 |
| Alps - Italy (Valle d'Aosta) | #57CC99 |
| USA - West | #F4A261 |
| USA - Pacific NW & Alaska | #9B5DE5 |
| USA - Rockies | #3A86FF |
| USA - Midwest | #FB8500 |
| USA - East | #00B4D8 |
| Canada - West | #FF006E |
| Canada - East | #C77DFF |
| South America | #80B918 |
| Australia / New Zealand | #06D6A0 |
| Japan | #EF476F |
| Asia - Other | #FFD166 |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (dark theme)
│   ├── page.tsx            # Entry point
│   └── globals.css         # Tailwind + custom tokens
├── components/
│   ├── MapLayout.tsx       # Main layout + filter state
│   ├── FeltMap.tsx         # Felt map embed (SDK + iframe fallback)
│   ├── Sidebar.tsx         # Filter controls + resort list
│   └── ResortCard.tsx      # Resort list item
├── data/
│   └── resorts.ts          # All 97 resorts (static data)
└── types.ts                # TypeScript types + color map
scripts/
└── setup-felt-map.ts       # Creates Felt map via REST API
```

## License

MIT
