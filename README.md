# Trip planner (ELD / HOS assessment)

Full-stack **trip planner** for commercial drivers: enter current location, pickup, dropoff, and hours used in the current 70/8 cycle. The app shows an **OSM-based route** on the map (Nominatim geocoding + OSRM routing + Leaflet) and **daily HOS/ELD-style log grids** aligned with common rules (11/14, 8/30, 10-hour break, 70/8, 1-hour pickup/drop loading, 30-minute fuel break every 1000 miles on-duty).

**Stack:** Django REST API + React (Vite).

## Live app

**DEMO:** [https://full-stack-assessment-sigma.vercel.app/](https://full-stack-assessment-sigma.vercel.app/)

The deployed frontend expects a configured backend URL (see **Deploy** below). For full functionality locally, run both API and Vite as in **Run locally**.

## Clone the repository

```bash
git clone https://github.com/Superstar-IT/full-stack-assessment.git
cd full-stack-assessment
```

## Run locally

From the repository root:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 4000
```

In another terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

### Frontend environment (`frontend/.env`)

The app reads **`VITE_API_URL`** (see `frontend/.env.example`). It must match the origin where Django is running (no trailing slash).

1. **Copy the example file** (once):

   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Edit `frontend/.env`** if your API is not at `http://localhost:4000`. For example, if Django uses the default port:

   ```bash
   VITE_API_URL=http://127.0.0.1:4000
   ```

3. **Restart** `npm run dev` after any change to `.env` — Vite loads these variables when the dev server starts.

If `VITE_API_URL` is missing or empty, API requests use the same origin as the Vite app (`/api/...`), which only works when the frontend and API share one origin (for example a production build served behind the same host). For typical local development with `npm run dev` and `runserver` on another port, **keep `VITE_API_URL` set** so `/api/geocode` and `/api/plan` hit Django directly.

## API

### `GET /api/geocode`

Nominatim search proxy for address autocomplete (avoids browser CORS). Debounce calls from the client.

**Query**

- `q` — search string (fewer than 3 non-space characters returns `{"results": []}`)

**Response** (JSON)

- `results` — array of up to 8 objects: `display_name`, `lat`, `lon`

On upstream failure the handler returns `{"results": []}`.

### `POST /api/plan` (JSON)

- `current_location`, `pickup_location`, `dropoff_location` — address strings
- `current_cycle_used_hrs` — `0`–`70`
- `time_zone` — IANA name (default `America/Chicago`)
- `trip_start` — optional ISO-8601; default is today 06:00 in `time_zone`


## Map APIs (free, public)

- [Nominatim](https://nominatim.org/) (geocoding) — use a real `User-Agent` (see `trip/services.py`).
- [OSRM public demo](https://router.project-osrm.org/) (routing) — for heavy production load, run your own OSRM or use a paid routing API.
- [OpenStreetMap](https://www.openstreetmap.org/copyright) tiles (attribution appears in the UI).
