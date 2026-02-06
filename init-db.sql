-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create schema for Gunnison map data
CREATE SCHEMA IF NOT EXISTS gunnison;

-- Spatial reference systems used:
-- EPSG:2232 = NAD83 / Colorado Central (ftUS) - source CRS for most shapefiles
-- EPSG:32613 = WGS 84 / UTM zone 13N - source CRS for Sections.shp
-- EPSG:4326 = WGS 84 - target CRS for web compatibility

-- Tables will be created by ogr2ogr in the gunnison schema
