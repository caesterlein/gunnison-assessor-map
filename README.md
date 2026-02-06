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
tipg API (internal Docker network)
    ↓ [nginx reverse proxy at /api/*]
    ↓
React Frontend (nginx serving static files)
    ↓
Browser (http://localhost:3000)
```

### Key Technologies

- **Backend**: PostGIS 16, tipg (OGC Features API)
- **Frontend**: React 19, MapLibre GL 5, TypeScript, Vite
- **Web Server**: nginx (serves static files and proxies API requests)
- **Data Processing**: GDAL/OGR (ogr2ogr), Shapefile format
- **Infrastructure**: Docker Compose (multi-stage builds)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (only for local frontend development)

### Start the Application

```bash
# Start all services (PostGIS, tipg API, shapefile loader, and client)
docker compose up -d

# Check logs
docker compose logs -f

# Or check specific service logs
docker compose logs -f client
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the map.

The complete stack is now running:
- **Web app**: http://localhost:3000 (nginx serving React app)
- **API**: http://localhost:3000/api/* (proxied to tipg)
- **Direct API access**: http://localhost:8000 (for debugging)

## Development Commands

### Docker Services (Production Mode)

```bash
# Start all services
docker compose up -d

# Rebuild client after code changes
docker compose build client
docker compose up -d client

# View service logs
docker compose logs -f client
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

### Frontend Development (Hot Reload)

For faster frontend development with hot module replacement:

```bash
cd client

# Install dependencies (first time only)
npm install

# Development server with hot reload
npm run dev  # Opens http://localhost:5173

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

**Note**: When using `npm run dev`, update `client/src/config/layers.ts` to use:
```typescript
export const TIPG_URL = "http://localhost:8000";
```
Then revert to `"/api"` before building the Docker image.

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
    ├── Dockerfile            # Multi-stage build (Node.js build + nginx)
    ├── nginx.conf            # Nginx configuration (reverse proxy + SPA)
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

Visit `http://localhost:3000/api/collections` (or `http://localhost:8000/collections`) to verify your layer is loaded.

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

The OGC Features API (tipg) provides REST endpoints for spatial data, accessible through nginx proxy:

- `GET /api/collections` - List all available layers
- `GET /api/collections/{id}` - Get layer metadata
- `GET /api/collections/{id}/items` - Fetch features as GeoJSON (supports bbox, limit, offset)
- `GET /api/collections/{id}/items/{itemId}` - Get single feature

Example (using proxied API):
```bash
# Get all roads (first 10 features)
curl "http://localhost:3000/api/collections/road/items?limit=10"

# Get features in bounding box
curl "http://localhost:3000/api/collections/jurisdictions/items?bbox=-107,38,-106,39"
```

Direct API access (for debugging):
```bash
# Direct access to tipg (bypasses nginx)
curl "http://localhost:8000/collections"
```

## Troubleshooting

### Shapefiles not loading

1. Check shapefile files exist: `ls -la GISData/`
2. Verify PostGIS is healthy: `docker compose logs postgis`
3. Check GDAL compatibility: `docker compose logs loader`
4. Reload: `docker compose up loader`

### Frontend not connecting to API

1. Ensure all services are running: `docker compose ps`
2. Check client logs: `docker compose logs client`
3. Test API proxy: `curl http://localhost:3000/api/collections`
4. Test direct API: `curl http://localhost:8000/collections`
5. Check browser console for errors
6. Verify nginx proxy config: `client/nginx.conf`

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
