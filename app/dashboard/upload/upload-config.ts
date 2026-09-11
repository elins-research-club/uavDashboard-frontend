export interface BatchFileItem {
  id: string;
  file: File;
  name: string;
  layer_type: string;
  is_base: boolean;
  default_opacity: number;
}

export interface ManualSlotItem {
  id: string;
  name: string;
  layer_type: string;
  file: File | null;
  default_opacity: number;
}

export const LAYER_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    badgeClass: string;
    defaultName: string;
    defaultOpacity: number;
  }
> = {
  ortho: {
    label: "Citra Ortho RGB",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    defaultName: "Citra Ortho RGB",
    defaultOpacity: 1,
  },
  ndvi: {
    label: "Indeks Vegetasi (NDVI)",
    badgeClass: "border-lime-200 bg-lime-50 text-lime-800",
    defaultName: "Indeks Vegetasi (NDVI)",
    defaultOpacity: 0.85,
  },
  vari: {
    label: "Indeks Vegetasi (VARI)",
    badgeClass: "border-teal-200 bg-teal-50 text-teal-800",
    defaultName: "Indeks Vegetasi (VARI)",
    defaultOpacity: 0.85,
  },
  nitrogen: {
    label: "Kandungan Nitrogen (N)",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-800",
    defaultName: "Kandungan Nitrogen (N)",
    defaultOpacity: 0.75,
  },
  phosphorus: {
    label: "Kandungan Fosfor (P)",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    defaultName: "Kandungan Fosfor (P)",
    defaultOpacity: 0.75,
  },
  kalium: {
    label: "Kandungan Kalium (K)",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-800",
    defaultName: "Kandungan Kalium (K)",
    defaultOpacity: 0.75,
  },
  dsm: {
    label: "Model Elevasi (DSM)",
    badgeClass: "border-stone-200 bg-stone-100 text-stone-800",
    defaultName: "Model Elevasi (DSM)",
    defaultOpacity: 0.7,
  },
  spectral: {
    label: "Saluran Multispektral",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
    defaultName: "Saluran Multispektral",
    defaultOpacity: 0.8,
  },
  custom: {
    label: "Layer Tematik Kustom",
    badgeClass: "border-gray-200 bg-gray-100 text-gray-800",
    defaultName: "Layer Tematik",
    defaultOpacity: 0.8,
  },
};

export const layerOptions = [
  { value: "ortho", label: "Citra Ortho RGB" },
  { value: "ndvi", label: "NDVI (Vegetasi)" },
  { value: "vari", label: "VARI" },
  { value: "nitrogen", label: "Nitrogen (N)" },
  { value: "phosphorus", label: "Fosfor (P)" },
  { value: "kalium", label: "Kalium (K)" },
  { value: "dsm", label: "DSM (Elevasi)" },
  { value: "spectral", label: "Multispektral" },
  { value: "custom", label: "Layer Kustom" },
];

export const manualLayerOptions = layerOptions.filter(
  (option) => option.value !== "ortho"
);

export function autoDetectLayer(filename: string) {
  const fn = filename.toLowerCase();

  const isToken = (token: string) =>
    new RegExp(`(^|[_\\-.])${token}([_\\-.]|$)`, "i").test(fn);

  if (/ortho|rgb|citra|foto|mosaic|mosaik/.test(fn)) {
    return {
      layer_type: "ortho",
      name: "Citra Ortho RGB",
      is_base: true,
      default_opacity: 1,
    };
  }

  if (fn.includes("ndvi")) {
    return {
      layer_type: "ndvi",
      name: "Indeks Vegetasi (NDVI)",
      is_base: false,
      default_opacity: 0.85,
    };
  }

  if (fn.includes("vari")) {
    return {
      layer_type: "vari",
      name: "Indeks Vegetasi (VARI)",
      is_base: false,
      default_opacity: 0.85,
    };
  }

  if (/nitrogen/.test(fn) || isToken("n") || fn.includes("n_ppm")) {
    return {
      layer_type: "nitrogen",
      name: "Kandungan Nitrogen (N)",
      is_base: false,
      default_opacity: 0.75,
    };
  }

  if (/phosphor|fosfor/.test(fn) || isToken("p") || fn.includes("p_ppm")) {
    return {
      layer_type: "phosphorus",
      name: "Kandungan Fosfor (P)",
      is_base: false,
      default_opacity: 0.75,
    };
  }

  if (/kalium|potassium/.test(fn) || isToken("k") || fn.includes("k_ppm")) {
    return {
      layer_type: "kalium",
      name: "Kandungan Kalium (K)",
      is_base: false,
      default_opacity: 0.75,
    };
  }

  if (/dsm|dem|elevasi|elevation|dtm/.test(fn)) {
    return {
      layer_type: "dsm",
      name: "Model Elevasi (DSM)",
      is_base: false,
      default_opacity: 0.7,
    };
  }

  if (/spectral|spektral|nir|rededge|red_edge|red-edge/.test(fn)) {
    return {
      layer_type: "spectral",
      name: "Saluran Multispektral",
      is_base: false,
      default_opacity: 0.8,
    };
  }

  const cleanName = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

  return {
    layer_type: "custom",
    name: cleanName || "Layer Tematik",
    is_base: false,
    default_opacity: 0.8,
  };
}

export function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

