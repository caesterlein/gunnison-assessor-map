#!/bin/bash

# Load Gunnison County shapefiles into PostGIS using ogr2ogr
# All data is transformed to EPSG:4326 (WGS84) for web compatibility

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-gunnison}"
DB_PASS="${PGPASSWORD}"

GISDATA_DIR="${GISDATA_DIR:-/GISData}"

PG_CONN="PG:host=${DB_HOST} dbname=${DB_NAME} user=${DB_USER} password=${DB_PASS}"

echo "Loading shapefiles into PostGIS..."

# Collections using EPSG:2232 (NAD83 / Colorado Central ftUS)
COLLECTIONS_2232=(
    "Address:address"
    "Driveway:driveway"
    "Exempt:exempt"
    "Jurisdictions:jurisdictions"
    "Road:road"
    "Subdivision:subdivision"
    "TaxDistrict:taxdistrict"
    "TaxParcelAssessor:taxparcelassessor"
    "Towns:towns"
    "VotingPrecincts:votingprecincts"
)

for item in "${COLLECTIONS_2232[@]}"; do
    shapefile="${item%%:*}"
    tablename="${item##*:}"

    if [ -f "$GISDATA_DIR/${shapefile}.shp" ]; then
        echo "Loading ${shapefile}.shp -> ${tablename} (EPSG:2232 -> 4326)..."
        ogr2ogr -f "PostgreSQL" "$PG_CONN" \
            -nln "gunnison.$tablename" \
            -nlt PROMOTE_TO_MULTI \
            -lco GEOMETRY_NAME=geom \
            -lco FID=gid \
            -s_srs EPSG:2232 \
            -t_srs EPSG:4326 \
            -overwrite \
            "$GISDATA_DIR/${shapefile}.shp"
    else
        echo "Warning: $GISDATA_DIR/${shapefile}.shp not found, skipping..."
    fi
done

# Sections uses EPSG:32613 (UTM Zone 13N)
if [ -f "$GISDATA_DIR/Sections.shp" ]; then
    echo "Loading Sections.shp -> sections (EPSG:32613 -> 4326)..."
    ogr2ogr -f "PostgreSQL" "$PG_CONN" \
        -nln "gunnison.sections" \
        -nlt PROMOTE_TO_MULTI \
        -lco GEOMETRY_NAME=geom \
        -lco FID=gid \
        -s_srs EPSG:32613 \
        -t_srs EPSG:4326 \
        -overwrite \
        "$GISDATA_DIR/Sections.shp"
else
    echo "Warning: $GISDATA_DIR/Sections.shp not found, skipping..."
fi

echo "Done! All shapefiles loaded."
echo ""
echo "Verify by visiting:"
echo "  - tipg landing page: http://localhost:8000/"
echo "  - Collections list:  http://localhost:8000/collections"
