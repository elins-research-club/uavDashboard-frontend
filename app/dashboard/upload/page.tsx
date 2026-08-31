"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserRole } from "@/context/UserRoleContext";
import {
  Upload,
  FileText,
  MapPin,
  Lock,
  CheckCircle,
  CheckCircle2,
  Image,
  File,
  Database,
  Calendar,
  Info,
  X,
  Folder,
  AlertCircle,
  AlertTriangle,
  Compass,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Globe,
  Layers,
  Cpu,
  Check,
} from "lucide-react";
import api from "@/lib/api";
import { GeoMetadata, ErrorDetailObject } from "@/types/map";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [geoSuccess, setGeoSuccess] = useState<{ title: string; mapId: string; metadata?: GeoMetadata } | null>(null);
  const [geoError, setGeoError] = useState<ErrorDetailObject | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Only admins can upload maps in a DaaS model
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setMessage("");
      setGeoError(null);
      setGeoSuccess(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMessage("");
      setGeoError(null);
      setGeoSuccess(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMessage("");
    setGeoError(null);
    setGeoSuccess(null);
  };

  const isTiff = selectedFile?.name.toLowerCase().endsWith(".tif") || selectedFile?.name.toLowerCase().endsWith(".tiff");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setUploadProgress(0);
    setMessage("");
    setIsSuccess(false);
    setGeoError(null);
    setGeoSuccess(null);

    // Save form reference before async call (currentTarget becomes null after await)
    const formData = new FormData(e.currentTarget);

    try {
      const res = await api.post("/maps", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: ({ loaded, total }) => {
          if (total) {
            const pct = Math.round((loaded * 100) / total);
            setUploadProgress(pct >= 100 ? 99 : pct);
          }
        },
      });
      setUploadProgress(100);
      setMessage("Upload & Validasi Geospasial Berhasil! File GeoTIFF siap digunakan untuk analisis dan tiling.");
      setIsSuccess(true);
      setGeoError(null);
      setGeoSuccess({
        title: res.data.title,
        mapId: res.data.id,
        metadata: res.data.geo_metadata,
      });
      setSelectedFile(null);
      formRef.current?.reset();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string | ErrorDetailObject } } };
      const detail = axiosError.response?.data?.detail;
      if (typeof detail === "object" && detail !== null) {
        setGeoError(detail);
        setMessage(detail.message || "Validasi Geospasial Ditolak");
      } else {
        setGeoError(null);
        setMessage(detail || "Upload gagal. Silakan periksa kembali file dan koneksi server.");
      }
      setIsSuccess(false);
      setGeoSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-gray-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              Unggah Data Peta Baru
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Upload file peta hasil olahan fotogrametri (GeoTIFF) dengan validasi CRS spasial otomatis
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Upload Form */}
          <div className="lg:col-span-2">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-900">
                    File Peta Geospasial
                  </label>
                  <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Auto-Validasi CRS Spasial Aktif
                  </span>
                </div>

                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : selectedFile
                      ? isTiff
                        ? "border-blue-400 bg-blue-50/50"
                        : "border-amber-500 bg-amber-50/50"
                      : "border-gray-300 hover:border-gray-400 bg-gray-50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="fileUpload"
                    name="file"
                    className="hidden"
                    accept=".tiff,.tif"
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            isTiff
                              ? "bg-blue-100 border-blue-200 text-blue-700"
                              : "bg-amber-100 border-amber-200 text-amber-700"
                          }`}>
                            {isTiff ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-md">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* File Format Badge */}
                      <div className="text-left pt-2 border-t border-gray-200/60">
                        {isTiff ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-md border border-blue-300">
                            <Compass className="w-3.5 h-3.5" />
                            Ekstensi GeoTIFF Terdeteksi (Menunggu Validasi Server)
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-md border border-red-300">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Format Tidak Didukung: Wajib file GeoTIFF (.tif / .tiff)
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-600">
                        <Folder className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Drag & drop file hasil olahan pemetaan ke sini, atau
                      </p>
                      <label
                        htmlFor="fileUpload"
                        className="inline-block bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 cursor-pointer transition-colors shadow-sm"
                      >
                        Pilih File GeoTIFF
                      </label>
                      <p className="text-xs text-gray-500 mt-3">
                        Rekomendasi: <strong>.tif, .tiff (GeoTIFF Orthomosaic)</strong> (Maks: 5GB)
                      </p>
                    </>
                  )}
                </div>

                {/* Upload Progress & Phase Indicator */}
                {loading && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3.5 animate-in fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-900 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        {uploadProgress >= 99
                          ? "🛰️ Memvalidasi CRS, GeoTransform, & Header Spasial..."
                          : "Mengunggah data peta ke server..."}
                      </span>
                      <span className="text-xs font-bold text-blue-600">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Details */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Detail Metadata Peta
                </h3>
                <div className="space-y-4">
                  {/* Title Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Judul Peta
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="title"
                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900 font-medium"
                        placeholder="Contoh: Peta Orthomosaic Lahan Padi - Jul 2026"
                        required
                      />
                    </div>
                  </div>

                  {/* Location Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Lokasi / Wilayah
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="location"
                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900 font-medium"
                        placeholder="Contoh: Desa Sriharjo, Kec. Imogiri, Bantul"
                        required
                      />
                    </div>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Tanggal Survey Drone
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        name="survey_date"
                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Type Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Tipe / Analisis Peta
                    </label>
                    <select
                      name="map_type"
                      defaultValue="NDVI"
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900 font-medium"
                    >
                      <option value="NDVI">NDVI (Kesehatan Vegetasi)</option>
                      <option value="Soil Analysis">Soil Analysis (Kesuburan/NPK)</option>
                      <option value="Topography">Topography (Kontur & Elevasi)</option>
                      <option value="Fertility">Fertility (Indeks Kesuburan)</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Deskripsi Tambahan (Opsional)
                    </label>
                    <textarea
                      name="description"
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900 resize-none"
                      rows={3}
                      placeholder="Informasi ketinggian terbang, sensor kamera, dsb..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Access Control */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Aturan Akses & Monetisasi DaaS
                  </h3>
                </div>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                    <input
                      type="checkbox"
                      name="locked_for_free"
                      className="w-4 h-4 mt-0.5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Kunci untuk Member Free
                      </p>
                      <p className="text-xs text-gray-600">
                        Hanya member berbayar (Tier Desa/Kecamatan) yang dapat mengakses data peta ini
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                    <input
                      type="checkbox"
                      name="purchasable"
                      className="w-4 h-4 mt-0.5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Tersedia untuk Pembelian Satuan (Pay-per-view)
                      </p>
                      <p className="text-xs text-gray-600">
                        User dapat membeli akses peta ini secara terpisah tanpa langganan
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Result Message: Rejection Diagnosis Card */}
              {!isSuccess && (geoError || message) && (
                <div className="p-5 rounded-2xl border bg-red-50/80 border-red-200 text-red-950 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-sm space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-200/80 text-red-900 border border-red-300">
                            {geoError?.error_type || "VALIDASI DITOLAK"}
                          </span>
                          <span className="text-xs text-red-700 font-medium">Standard DaaS GIS Integrity</span>
                        </div>
                        <h4 className="font-bold text-base text-red-900 leading-snug">
                          {geoError?.message || message || "Gagal Memproses File Peta"}
                        </h4>
                      </div>

                      {/* File Characteristics Detected */}
                      {geoError?.details?.file_characteristics && (
                        <div className="bg-white/90 rounded-xl p-3.5 border border-red-200 text-xs space-y-2">
                          <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-red-600" />
                            Karakteristik File yang Terdeteksi oleh Engine GIS:
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-gray-700">
                            <div className="bg-red-50/60 p-2 rounded-lg border border-red-100">
                              <span className="text-gray-500 block">Status Proyeksi (CRS):</span>
                              <span className="font-bold text-red-700">{geoError.details.file_characteristics.crs}</span>
                            </div>
                            {geoError.details.file_characteristics.gps_metadata && (
                              <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                                <span className="text-gray-500 block">Metadata GPS Kamera:</span>
                                <span className="font-semibold text-amber-900">{geoError.details.file_characteristics.gps_metadata}</span>
                              </div>
                            )}
                            {geoError.details.file_characteristics.dimensions && (
                              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                <span className="text-gray-500 block">Dimensi & Saluran:</span>
                                <span className="font-semibold text-gray-900">{geoError.details.file_characteristics.dimensions}</span>
                              </div>
                            )}
                            {geoError.details.file_characteristics.camera_source && (
                              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                <span className="text-gray-500 block">Sumber Perangkat:</span>
                                <span className="font-semibold text-gray-900">{geoError.details.file_characteristics.camera_source}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Missing Requirements List */}
                      {geoError?.details?.missing_requirements && geoError.details.missing_requirements.length > 0 && (
                        <div className="bg-red-100/50 rounded-xl p-3 border border-red-200 text-xs">
                          <p className="font-semibold text-red-900 mb-1.5 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            Kekurangan / Komponen yang Hilang:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-[11px] text-red-800">
                            {geoError.details.missing_requirements.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Why Rejected Rationale */}
                      {geoError?.details?.why_rejected && (
                        <p className="text-xs text-red-800 bg-white/70 p-3 rounded-xl border border-red-100 leading-relaxed">
                          <strong>💡 Mengapa ditolak:</strong> {geoError.details.why_rejected}
                        </p>
                      )}

                      {/* Solution / Action Required */}
                      {geoError?.details?.solution && (
                        <div className="p-3 bg-white rounded-xl border border-red-200 text-xs text-gray-800 shadow-sm">
                          <p className="font-bold text-red-800 mb-1 flex items-center gap-1.5">
                            <span>🛠️</span> Langkah Solusi & Panduan Pengolahan:
                          </p>
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            {geoError.details.solution}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Result Message: Approval Feedback Card with Verified Metadata */}
              {isSuccess && geoSuccess && (
                <div className="p-5 rounded-2xl border bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 flex-shrink-0 mt-0.5 shadow-sm">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-sm space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 border border-emerald-300">
                            ✓ VALIDASI SPASIAL LOLOS
                          </span>
                          <span className="text-xs text-emerald-700 font-semibold">100% Standar DaaS Orthomosaic</span>
                        </div>
                        <h4 className="font-bold text-base text-emerald-900">
                          {geoSuccess.title || "Peta Berhasil Divalidasi & Disimpan!"}
                        </h4>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Metadata geospasial telah diverifikasi. Engine <code className="bg-emerald-200/60 px-1 py-0.5 rounded font-mono text-[11px]">rio-tiler</code> siap menyajikan Slippy Map XYZ tiles secara instan.
                        </p>
                      </div>

                      {/* Verified Metadata Bento Grid */}
                      {geoSuccess.metadata && (
                        <div className="bg-white/95 rounded-xl p-4 border border-emerald-200 shadow-sm">
                          <p className="font-bold text-xs text-gray-900 mb-3 flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-emerald-600" />
                            Struktur & Metadata Geospasial Terverifikasi:
                          </p>
                          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                              <span className="text-[10px] text-gray-500 font-medium block uppercase tracking-wider">Proyeksi (CRS)</span>
                              <span className="font-bold text-emerald-700 text-xs truncate block" title={geoSuccess.metadata.crs}>
                                {geoSuccess.metadata.crs}
                              </span>
                            </div>

                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                              <span className="text-[10px] text-gray-500 font-medium block uppercase tracking-wider">Dimensi Piksel</span>
                              <span className="font-bold text-gray-900 text-xs">
                                {geoSuccess.metadata.width.toLocaleString()} × {geoSuccess.metadata.height.toLocaleString()} px
                              </span>
                            </div>

                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                              <span className="text-[10px] text-gray-500 font-medium block uppercase tracking-wider">Saluran / Band</span>
                              <span className="font-bold text-gray-900 text-xs">
                                {geoSuccess.metadata.bands} Band ({geoSuccess.metadata.dtypes.join(", ")})
                              </span>
                            </div>

                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                              <span className="text-[10px] text-gray-500 font-medium block uppercase tracking-wider">Driver / Tiling</span>
                              <span className="font-bold text-gray-900 text-xs">
                                {geoSuccess.metadata.driver} {geoSuccess.metadata.is_tiled ? "(COG Tiled)" : "(Standar)"}
                              </span>
                            </div>

                            {geoSuccess.metadata.bounds_wgs84 && (
                              <div className="sm:col-span-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-medium block uppercase tracking-wider">Batas Koordinat WGS 84 (Bbox)</span>
                                <span className="font-semibold text-gray-800 text-[11px] font-mono block">
                                  [{geoSuccess.metadata.bounds_wgs84.min_lat}°, {geoSuccess.metadata.bounds_wgs84.min_lon}°] s/d [{geoSuccess.metadata.bounds_wgs84.max_lat}°, {geoSuccess.metadata.bounds_wgs84.max_lon}°]
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Navigation */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Link
                          href="/dashboard/maps"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:shadow"
                        >
                          🗺️ Buka di Peta (Dashboard)
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSuccess(false);
                            setGeoSuccess(null);
                            setMessage("");
                          }}
                          className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-300 transition-colors"
                        >
                          Unggah File Peta Lain
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memproses & Memvalidasi...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Validasi & Unggah Peta
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            {/* Geospatial SOP Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Standar Data Geospasial
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>Format Wajib:</strong> GeoTIFF Orthomosaic (`.tif`/`.tiff`)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>Sistem Koordinat:</strong> WGS 84 / UTM / EPSG:3857</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>Ukuran Maksimal:</strong> 5 GB per file peta</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span><strong>Resolusi Bit:</strong> 8-bit UInt8 (RGB / Multispektral)</span>
                </li>
              </ul>
            </div>

            {/* Supported Formats */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Format yang Didukung
              </h3>
              <div className="space-y-2">
                {[
                  {
                    ext: "GeoTIFF (.tif / .tiff)",
                    desc: "Wajib untuk Peta Spasial Ber-CRS (WGS84 / UTM)",
                    icon: <Compass className="w-4 h-4" />,
                    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
                  },
                  {
                    ext: "Cloud Optimized GeoTIFF (COG)",
                    desc: "Sangat direkomendasikan untuk kecepatan tiling",
                    icon: <ShieldCheck className="w-4 h-4" />,
                    color: "text-blue-700 bg-blue-50 border-blue-200",
                  },
                ].map((format, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${format.color}`}
                  >
                    <div className="flex items-center gap-2">
                      <div>{format.icon}</div>
                      <div>
                        <span className="text-xs font-semibold block">{format.ext}</span>
                        <span className="text-[10px] text-gray-500 block">{format.desc}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Storage Server DaaS
                </h3>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-600">Penyimpanan Server</span>
                  <span className="font-semibold text-gray-900">Maks 5 GB / File</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gray-900 h-1.5 rounded-full"
                    style={{ width: "25%" }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Peta akan otomatis diproses ke format XYZ Tile Layer untuk Leaflet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
