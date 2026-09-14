import * as turf from "@turf/turf";

export interface PetakProperties {
  block_id: string;
  row_idx: number;
  col_idx: number;
  center_lat: number;
  center_lng: number;
  area_m2: number;
  nitrogen: number;
  phospor: number;
  kalium: number;
  ph: number;
  kelembapan: number;
  c_organik: number;
  priority?: "N" | "P" | "K";
  [key: string]: any;
}

export interface GridResult {
  features: GeoJSON.Feature<GeoJSON.Polygon, PetakProperties>[];
  totalBlocks: number;
  cellSize: number;
}

// ponytail: local equirectangular projection around centroid for sub-decimeter accuracy on agricultural parcels
export function generatePetakGrid(
  boundaryInput: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | any,
  cellSize = 10
): GridResult {
  if (!boundaryInput) {
    return { features: [], totalBlocks: 0, cellSize };
  }

  const boundaryFeature: GeoJSON.Feature<any> =
    boundaryInput.type === "Feature"
      ? boundaryInput
      : turf.feature(boundaryInput.geometry || boundaryInput);

  if (!boundaryFeature || !boundaryFeature.geometry) {
    return { features: [], totalBlocks: 0, cellSize };
  }

  const centroid = turf.centroid(boundaryFeature).geometry.coordinates;
  const kx = 111320 * Math.cos((centroid[1] * Math.PI) / 180);
  const ky = 110574;

  const toM = ([lng, lat]: [number, number]): [number, number] => [
    (lng - centroid[0]) * kx,
    (lat - centroid[1]) * ky,
  ];
  const toLL = ([x, y]: [number, number]): [number, number] => [
    centroid[0] + x / kx,
    centroid[1] + y / ky,
  ];

  const bbox = turf.bbox(boundaryFeature);
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const [minX, minY] = toM([minLng, minLat]);
  const [maxX, maxY] = toM([maxLng, maxLat]);

  const x0 = Math.floor(minX / cellSize) * cellSize;
  const y0 = Math.floor(minY / cellSize) * cellSize;

  const features: GeoJSON.Feature<GeoJSON.Polygon, PetakProperties>[] = [];
  let row = 0;

  for (let y = y0; y < maxY; y += cellSize, row++) {
    let col = 0;
    for (let x = x0; x < maxX; x += cellSize, col++) {
      const cornersM: [number, number][] = [
        [x, y],
        [x + cellSize, y],
        [x + cellSize, y + cellSize],
        [x, y + cellSize],
        [x, y],
      ];
      const ringLL = cornersM.map(toLL);
      const poly: GeoJSON.Polygon = {
        type: "Polygon",
        coordinates: [ringLL],
      };

      const cellFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: "Feature",
        properties: {},
        geometry: poly,
      };

      if (!turf.booleanIntersects(cellFeature, boundaryFeature)) {
        continue;
      }

      const [clng, clat] = toLL([x + cellSize / 2, y + cellSize / 2]);
      const blockId = `${row}-${col}`;

      const seed = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
      const noise = seed - Math.floor(seed);

      const nVal = Math.round(45 + noise * 45);
      const pVal = Math.round(20 + noise * 25);
      const kVal = Math.round(90 + (1 - noise) * 70);
      const phVal = Number((6.1 + noise * 0.7).toFixed(1));
      const moistureVal = Math.round(62 + noise * 16);
      const cOrgVal = Number((1.5 + noise * 1.1).toFixed(1));

      let priority: "N" | "P" | "K" = "K";
      if (nVal < 55) priority = "N";
      else if (pVal < 28) priority = "P";

      features.push({
        type: "Feature",
        geometry: poly,
        properties: {
          block_id: blockId,
          row_idx: row,
          col_idx: col,
          center_lat: clat,
          center_lng: clng,
          area_m2: cellSize * cellSize,
          nitrogen: nVal,
          phospor: pVal,
          kalium: kVal,
          ph: phVal,
          kelembapan: moistureVal,
          c_organik: cOrgVal,
          priority,
        },
      });
    }
  }

  return {
    features,
    totalBlocks: features.length,
    cellSize,
  };
}

export interface NutrientClass {
  nama: string;
  warna: string;
  isWarning?: boolean;
}

export function classifyParam(param: string, value: number | null | undefined): NutrientClass {
  if (value == null || isNaN(value)) {
    return { nama: "-", warna: "#9e9e9e" };
  }
  switch (param) {
    case "nitrogen":
      if (value < 30) return { nama: "Sangat Rendah", warna: "#e8f5e9", isWarning: true };
      if (value < 60) return { nama: "Rendah", warna: "#a5d6a7", isWarning: true };
      if (value < 95) return { nama: "Sedang", warna: "#4caf50" };
      return { nama: "Tinggi", warna: "#1b5e20" };
    case "phospor":
      if (value < 12) return { nama: "Sangat Rendah", warna: "#f3e5f5", isWarning: true };
      if (value < 25) return { nama: "Rendah", warna: "#ce93d8", isWarning: true };
      if (value < 45) return { nama: "Sedang", warna: "#8e24aa" };
      return { nama: "Tinggi", warna: "#4a148c" };
    case "kalium":
      if (value < 70) return { nama: "Sangat Rendah", warna: "#fff3e0", isWarning: true };
      if (value < 130) return { nama: "Rendah", warna: "#ffcc80", isWarning: true };
      if (value < 200) return { nama: "Sedang", warna: "#f57c00" };
      return { nama: "Tinggi", warna: "#b53d00" };
    case "ph":
      if (value < 5.5) return { nama: "Masam", warna: "#d03b3b", isWarning: true };
      if (value < 6.0) return { nama: "Agak Masam", warna: "#ec835a", isWarning: true };
      if (value <= 7.0) return { nama: "Optimal", warna: "#2e9e4f" };
      return { nama: "Agak Basa", warna: "#86b6ef" };
    case "kelembapan":
      if (value < 50) return { nama: "Kering", warna: "#d03b3b", isWarning: true };
      if (value <= 75) return { nama: "Optimal", warna: "#2e9e4f" };
      return { nama: "Lembap", warna: "#86b6ef" };
    case "c_organik":
      if (value < 1.0) return { nama: "Sangat Rendah", warna: "#efebe9", isWarning: true };
      if (value < 2.0) return { nama: "Rendah", warna: "#bcaaa4", isWarning: true };
      if (value < 3.0) return { nama: "Sedang", warna: "#795548" };
      return { nama: "Tinggi", warna: "#3e2723" };
    default:
      return { nama: "Normal", warna: "#4caf50" };
  }
}
