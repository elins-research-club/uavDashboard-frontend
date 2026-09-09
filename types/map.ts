export interface GeoMetadata {
  crs: string;
  crs_epsg?: number | null;
  width: number;
  height: number;
  bands: number;
  driver: string;
  dtypes: string[];
  bounds_native?: { left: number; bottom: number; right: number; top: number };
  bounds_wgs84?: { min_lon: number; min_lat: number; max_lon: number; max_lat: number } | null;
  nodata?: number | null;
  is_tiled?: boolean;
}

export interface RejectedErrorDetails {
  file_characteristics?: {
    crs?: string;
    gps_metadata?: string;
    camera_source?: string;
    dimensions?: string;
    driver?: string;
  };
  missing_requirements?: string[];
  why_rejected?: string;
  solution?: string;
  detected_format?: string;
  supported_formats?: string[];
}

export interface ErrorDetailObject {
  status?: string;
  error_type?: string;
  message?: string;
  details?: RejectedErrorDetails;
}

export interface MapLayerItem {
  id: string;
  map_id: string;
  layer_type: "ortho" | "spectral" | "ndvi" | "vari" | "nitrogen" | "phosphorus" | "kalium" | "dsm" | string;
  name: string;
  file_url: string;
  pmtiles_url?: string | null;
  file_size: number;
  is_base_layer: boolean;
  is_visible: boolean;
  default_opacity: number;
  display_order: number;
  color_map?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  unit?: string | null;
  geo_metadata?: GeoMetadata | null;
  conversion_status: "pending" | "processing" | "completed" | "failed" | string;
  conversion_error?: string | null;
  created_at: string;
}

