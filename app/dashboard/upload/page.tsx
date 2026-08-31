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
} from "lucide-react";
import api from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
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
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMessage("");
  };

  const isTiff = selectedFile?.name.toLowerCase().endsWith(".tif") || selectedFile?.name.toLowerCase().endsWith(".tiff");
  const isImage = selectedFile?.name.toLowerCase().endsWith(".png") || selectedFile?.name.toLowerCase().endsWith(".jpg") || selectedFile?.name.toLowerCase().endsWith(".jpeg");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setUploadProgress(0);
    setMessage("");
    setIsSuccess(false);

    // Save form reference before async call (currentTarget becomes null after await)
    const formData = new FormData(e.currentTarget);

    try {
      await api.post("/maps", formData, {
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
      setSelectedFile(null);
      formRef.current?.reset();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      setMessage(axiosError.response?.data?.detail || "Upload gagal. Silakan periksa kembali file dan koneksi server.");
      setIsSuccess(false);
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
                        ? "border-emerald-500 bg-emerald-50/50"
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
                    accept=".tiff,.tif,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            isTiff
                              ? "bg-emerald-100 border-emerald-200 text-emerald-700"
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
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-300">
                            <Compass className="w-3.5 h-3.5" />
                            Format GeoTIFF (Memenuhi Standar Orthomosaic Presisi)
                          </div>
                        ) : isImage ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-md border border-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Citra Standar: Tidak memiliki metadata CRS spasial native
                          </div>
                        ) : null}
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
                        Rekomendasi: <strong>.tif, .tiff (GeoTIFF Orthomosaic)</strong> (Maks: 150MB)
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

              {/* Result Message (Success / Error Alert Card) */}
              {message && (
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isSuccess
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isSuccess ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 text-sm">
                      <p className="font-bold mb-1">
                        {isSuccess ? "Upload & Validasi Berhasil!" : "Gagal Memproses File Peta"}
                      </p>
                      <p className="text-xs leading-relaxed opacity-90">{message}</p>

                      {/* Success Actions */}
                      {isSuccess && (
                        <div className="mt-3 flex items-center gap-3">
                          <Link
                            href="/dashboard/maps"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                          >
                            🗺️ Buka di Peta (Dashboard)
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}

                      {/* Error Troubleshooting Guide */}
                      {!isSuccess && (
                        <div className="mt-3 p-2.5 bg-white/80 rounded-lg border border-red-200 text-xs text-gray-700">
                          <p className="font-semibold text-red-800 mb-1">
                            💡 Panduan untuk Tim GIS / Pengolah Data:
                          </p>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-gray-600">
                            <li>Pastikan file diekspor sebagai <strong>Orthomosaic GeoTIFF</strong> dari software WebODM / Pix4D / Agisoft.</li>
                            <li>Pastikan opsi <strong>Export Coordinate System (CRS)</strong> diset ke <strong>WGS 84 / UTM Zone</strong> atau <strong>EPSG:3857</strong>.</li>
                            <li>Jangan mengunggah file foto mentah tunggal langsung dari kamera drone.</li>
                          </ul>
                        </div>
                      )}
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
                  <span><strong>Ukuran Maksimal:</strong> 150 MB per file peta</span>
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
                    ext: "GeoTIFF (.tif/.tiff)",
                    desc: "Wajib untuk Peta Spasial Ber-CRS",
                    icon: <Compass className="w-4 h-4" />,
                    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
                  },
                  {
                    ext: "PNG / JPG",
                    desc: "Citra biasa (Non-georeferenced)",
                    icon: <Image className="w-4 h-4" />,
                    color: "text-amber-700 bg-amber-50 border-amber-200",
                  },
                ].map((format, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${format.color}`}
                  >
                    <div className="flex items-center gap-2">
                      <div>{format.icon}</div>
                      <span className="text-xs font-semibold">{format.ext}</span>
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
                  <span className="font-semibold text-gray-900">Maks 150 MB / File</span>
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
