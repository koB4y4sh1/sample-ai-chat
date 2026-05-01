"""Models for Google Maps MCP App rendering."""

from __future__ import annotations

from pydantic import BaseModel, Field


class MapCoordinate(BaseModel):
    lat: float = Field(ge=-90, le=90, description="Latitude in decimal degrees.")
    lng: float = Field(ge=-180, le=180, description="Longitude in decimal degrees.")


class MapMarker(BaseModel):
    label: str = Field(min_length=1, description="Marker label shown in the map popup.")
    lat: float = Field(ge=-90, le=90, description="Marker latitude in decimal degrees.")
    lng: float = Field(ge=-180, le=180, description="Marker longitude in decimal degrees.")
    note: str | None = Field(default=None, description="Optional marker note shown in the map popup.")


class GoogleMapView(BaseModel):
    title: str = Field(description="Map title.")
    center: MapCoordinate = Field(description="Initial center point for the map.")
    zoom: int = Field(ge=1, le=20, description="Initial Google Maps zoom level.")
    markers: list[MapMarker] = Field(default_factory=list, description="Markers to render on the map.")
    api_key_configured: bool = Field(description="Whether the MCP server has a Google Maps browser API key configured.")
