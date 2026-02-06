# Gunnison County Interactive Map

An interactive web map for Gunnison County, Colorado that displays GIS data layers including parcels, roads, jurisdictions, tax districts, and more. Built with a modern Docker-based stack combining PostGIS for spatial data, a Node/OGC Features API backend, and a React/MapLibre frontend.

## Features

- **Interactive mapping** with MapLibre GL - smooth pan, zoom, and layer interactions
- **Multiple GIS layers** - parcels, roads, jurisdictions, tax districts, addresses, subdivisions, and more
- **Spatial database** - PostGIS integration for efficient spatial queries
- **OGC Features API** - tipg provides standard-compliant GeoJSON API endpoints
- **Responsive design** - works on desktop and mobile browsers

## Architecture

```
Shapefiles (GISData/)
    ↓ [ogr2ogr with CRS transforms]
    ↓
PostGIS Database
    ↓ [OGC Features API]
    ↓
tipg API (http://localhost:8000)
    ↓ [GeoJSON]
    ↓
React Frontend (MapLibre GL)
```

### Key Technologies

- **Backend**: PostGIS 16, tipg (OGC Features API)
- **Frontend**: React 19, MapLibre GL 5, TypeScript, Vite
- **Data Processing**: GDAL/OGR (ogr2ogr), Shapefile format
- **Infrastructure**: Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- npm/yarn

### 1. Start Backend Services

```bash
# Start PostGIS, tipg API, and shapefile loader
docker compose up -d

# Check logs
docker compose logs -f

# Verify tipg is running
curl http://localhost:8000/collections
```

The API will be available at `http://localhost:8000/` with OpenAPI documentation.

### 2. Start Frontend Development Server

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Development Commands

### Backend (Docker)

```bash
# Start all services
docker compose up -d

# View service logs
docker compose logs -f postgis
docker compose logs -f tipg
docker compose logs -f loader

# Reload shapefiles (restart data loader)
docker compose up loader

# Stop all services
docker compose down

# Clean up (remove volumes and containers)
docker compose down -v
```

### Frontend

```bash
cd client

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Project Structure

```
.
├── README.md                 # This file
├── CLAUDE.md                 # Project guidelines for Claude Code
├── docker-compose.yml        # Docker services configuration
├── init-db.sql               # PostgreSQL initialization script
├── load-shapefiles.sh        # GDAL/OGR script to load shapefiles
├── GISData/                  # Shapefile data directory
│   ├── Address.shp
│   ├── Jurisdictions.shp
│   ├── Road.shp
│   ├── TaxParcelAssessor.shp
│   └── ... (other GIS data)
└── client/                   # React frontend
    ├── src/
    │   ├── components/       # React components (Map, LayerControl, etc.)
    │   ├── config/           # Layer definitions and API configuration
    │   ├── App.tsx           # Main application component
    │   └── main.tsx          # React entry point
    ├── package.json          # Frontend dependencies
    ├── tsconfig.json         # TypeScript configuration
    ├── vite.config.ts        # Vite build configuration
    └── index.html            # HTML template
```

## Adding New Layers

### Step 1: Add Shapefile to GISData/

Place your shapefile (`.shp`, `.shx`, `.dbf`, etc.) in the `GISData/` directory.

### Step 2: Update Load Script

Edit `load-shapefiles.sh` and add your shapefile to the appropriate collection array:

```bash
# For EPSG:2232 (Colorado Central)
COLLECTIONS_2232=(
    "YourShapefile:yourtablename"
    # ... existing entries
)

# OR for other coordinate systems
# For EPSG:32613 (UTM Zone 13N)
```

Check the shapefile's source CRS and add it to the correct section.

### Step 3: Update Layer Configuration

Edit `client/src/config/layers.ts` and add your layer to the `LAYERS` array:

```typescript
{
  id: "yourlayer",
  name: "Your Layer Name",
  tableName: "yourtablename",
  geometryType: "polygon" | "line" | "point",
  color: "#FF0000",
}
```

### Step 4: Reload Data

```bash
docker compose up loader
```

Visit `http://localhost:8000/collections` to verify your layer is loaded.

## Database

- **Database**: gunnison
- **Host**: localhost:5432 (when running locally)
- **User/Password**: postgres/postgres (default, change in production)
- **Schema**: gunnison (contains all spatial tables)

All shapefiles are transformed to **EPSG:4326 (WGS84)** for web compatibility.

### Coordinate System Transforms

- **EPSG:2232** → EPSG:4326 (NAD83 / Colorado Central US Feet → WGS84)
- **EPSG:32613** → EPSG:4326 (UTM Zone 13N → WGS84)

## API

The OGC Features API (tipg) provides REST endpoints for spatial data:

- `GET /collections` - List all available layers
- `GET /collections/{id}` - Get layer metadata
- `GET /collections/{id}/items` - Fetch features as GeoJSON (supports bbox, limit, offset)
- `GET /collections/{id}/items/{itemId}` - Get single feature

Example:
```bash
# Get all roads (first 10 features)
curl "http://localhost:8000/collections/road/items?limit=10"

# Get features in bounding box
curl "http://localhost:8000/collections/jurisdictions/items?bbox=-107,38,-106,39"
```

## Troubleshooting

### Shapefiles not loading

1. Check shapefile files exist: `ls -la GISData/`
2. Verify PostGIS is healthy: `docker compose logs postgis`
3. Check GDAL compatibility: `docker compose logs loader`
4. Reload: `docker compose up loader`

### Frontend not connecting to API

1. Ensure tipg is running: `docker compose logs tipg`
2. Test API: `curl http://localhost:8000/collections`
3. Check frontend config: `client/src/config/`
4. Check browser console for CORS errors

### Database connection issues

1. Verify PostGIS is running: `docker compose ps`
2. Test connection: `docker compose exec postgis psql -U postgres -d gunnison -c "SELECT 1"`
3. Check volume: `docker volume ls | grep pgdata`

## Resources

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/)
- [PostGIS Documentation](https://postgit.org/documentation/)
- [OGC Features API Spec](https://www.ogc.org/standards/ogcapi-features)
- [GDAL/OGR Documentation](https://gdal.org/)

## License

[Add your license here]
