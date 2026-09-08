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
  Activity,
  ScanLine,
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
  const [geoSuccess, setGeoSuccess] = useState<{
    title: string;
    mapId: string;
    metadata?: GeoMetadata;
  } | null>(null);
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

  const isTiff =
    selectedFile?.name.toLowerCase().endsWith(".tif") ||
    selectedFile?.name.toLowerCase().endsWith(".tiff");

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
      setMessage(
        "Upload & Validasi Geospasial Berhasil! File GeoTIFF siap digunakan untuk analisis dan tiling."
      );
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
      const axiosError = error as {
        response?: { data?: { detail?: string | ErrorDetailObject } };
      };
      const detail = axiosError.response?.data?.detail;
      const isDetailObject = (d: unknown): d is ErrorDetailObject =>
        typeof d === "object" && d !== null;

      if (isDetailObject(detail)) {
        setGeoError(detail);
        setMessage(detail.message || "Validasi Geospasial Ditolak");
      } else {
        setGeoError(null);
        setMessage(
          typeof detail === "string" && detail.length > 0
            ? detail
            : "Upload gagal. Silakan periksa kembali file dan koneksi server."
        );
      }
      setIsSuccess(false);
      setGeoSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#123c28]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            TOP HEADER
        ====================================================== */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#91b928]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#123c28]/80">
                UAV DaaS PLATFORM
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#123c28] sm:text-4xl">
              Unggah Data <span className="text-[#1a5134]">Peta Baru</span>
            </h1>

            <p className="mt-3 text-sm font-medium text-[#123c28]/80">
              Upload file peta hasil olahan fotogrametri (GeoTIFF) dengan
              validasi CRS spasial otomatis.
            </p>
          </div>

          <Link
            href="/dashboard/maps"
            className="inline-flex items-center gap-2 rounded-full border border-[#123c28]/15 bg-[#f5f7f1] px-5 py-2.5 text-[11px] font-semibold text-[#123c28] transition hover:bg-[#eef3e8]"
          >
            Kelola Peta
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        {/* =====================================================
            QUICK STATUS
        ====================================================== */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#123c28]/15 bg-[#f7f8f4] px-3.5 py-2 text-[11px] font-semibold text-[#123c28]/85">
            <ShieldCheck className="h-3.5 w-3.5 text-[#123c28]" />
            Auto-Validasi CRS Spasial Aktif
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#123c28]/15 bg-[#f7f8f4] px-3.5 py-2 text-[11px] font-semibold text-[#123c28]/85">
            <ScanLine className="h-3.5 w-3.5 text-[#123c28]" />
            GeoTIFF Orthomosaic
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#123c28]/15 bg-[#f7f8f4] px-3.5 py-2 text-[11px] font-semibold text-[#123c28]/85">
            <Activity className="h-3.5 w-3.5 text-[#123c28]" />
            Maks 5GB per file
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* =====================================================
              MAIN FORM
          ====================================================== */}
          <div className="lg:col-span-2">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <section className="rounded-[28px] border border-[#123c28]/15 bg-white p-5 sm:p-7">
                <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed]">
                        <Upload className="h-4 w-4 text-[#123c28]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/75">
                        FILE GEOSPASIAL
                      </span>
                    </div>
                    <h2 className="text-xl font-bold tracking-[-0.03em]">
                      File Peta Geospasial
                    </h2>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3e8] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#123c28]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Validasi Otomatis
                  </span>
                </div>

                <div
                  className={`relative rounded-[22px] border-2 border-dashed p-8 text-center transition-all ${
                    dragActive
                      ? "border-[#123c28] bg-[#f3f6ed]"
                      : selectedFile
                      ? isTiff
                        ? "border-[#123c28]/40 bg-[#f7f8f4]"
                        : "border-[#f0ad25] bg-amber-50/50"
                      : "border-[#123c28]/20 bg-[#fafbf8] hover:border-[#123c28]/35"
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
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                              isTiff
                                ? "border-[#123c28]/15 bg-[#eef3e8] text-[#123c28]"
                                : "border-amber-200 bg-amber-100 text-amber-700"
                            }`}
                          >
                            {isTiff ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="max-w-md truncate text-sm font-bold text-[#123c28]">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs font-medium text-[#123c28]/70">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="rounded-lg p-1.5 text-[#123c28]/60 transition-colors hover:bg-[#123c28]/10 hover:text-[#123c28]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="border-t border-[#123c28]/10 pt-3 text-left">
                        {isTiff ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#123c28]">
                            <Compass className="h-3.5 w-3.5" />
                            Ekstensi GeoTIFF Terdeteksi (Menunggu Validasi
                            Server)
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-red-800">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Format Tidak Didukung: Wajib file GeoTIFF (.tif /
                            .tiff)
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f6ed] text-[#123c28]">
                        <Folder className="h-6 w-6" />
                      </div>
                      <p className="mb-3 text-sm font-semibold text-[#123c28]/85">
                        Drag & drop file hasil olahan pemetaan ke sini, atau
                      </p>
                      <label
                        htmlFor="fileUpload"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#123c28] px-5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#1a5134]"
                      >
                        Pilih File GeoTIFF
                      </label>
                      <p className="mt-3 text-xs font-medium text-[#123c28]/65">
                        Rekomendasi:{" "}
                        <strong className="text-[#123c28]/85">
                          .tif, .tiff (GeoTIFF Orthomosaic)
                        </strong>{" "}
                        (Maks: 5GB)
                      </p>
                    </>
                  )}
                </div>

                {/* Upload Progress */}
                {loading && (
                  <div className="mt-4 rounded-[18px] border border-[#123c28]/15 bg-[#f7f8f4] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-bold text-[#123c28]">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#123c28]" />
                        {uploadProgress >= 99
                          ? "Memvalidasi CRS, GeoTransform, & Header Spasial..."
                          : "Mengunggah data peta ke server..."}
                      </span>
                      <span className="text-xs font-bold text-[#123c28]">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#123c28]/10">
                      <div
                        className="h-2 rounded-full bg-[#123c28] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </section>

              {/* Map Details */}
              <section className="rounded-[28px] border border-[#123c28]/15 bg-white p-5 sm:p-7">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed]">
                    <FileText className="h-4 w-4 text-[#123c28]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/75">
                    INFORMASI PETA
                  </span>
                </div>
                <h2 className="mb-5 text-xl font-bold tracking-[-0.03em]">
                  Detail Informasi Peta
                </h2>

                <div className="space-y-4">
                  {/* Title Input */}
                  <div>
                    <label className="mb-2 block text-xs font-bold text-[#123c28]/80">
                      Judul Peta
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#123c28]/40" />
                      <input
                        type="text"
                        name="title"
                        className="w-full rounded-xl border border-[#123c28]/15 bg-[#fafbf8] py-2.5 pl-10 pr-3 text-sm font-medium text-[#123c28] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#123c28]"
                        placeholder="Contoh: Peta Orthomosaic Lahan Padi - Jul 2026"
                        required
                      />
                    </div>
                  </div>

                  {/* Location Input */}
                  <div>
                    <label className="mb-2 block text-xs font-bold text-[#123c28]/80">
                      Lokasi / Wilayah
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#123c28]/40" />
                      <input
                        type="text"
                        name="location"
                        className="w-full rounded-xl border border-[#123c28]/15 bg-[#fafbf8] py-2.5 pl-10 pr-3 text-sm font-medium text-[#123c28] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#123c28]"
                        placeholder="Contoh: Desa Sriharjo, Kec. Imogiri, Bantul"
                        required
                      />
                    </div>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="mb-2 block text-xs font-bold text-[#123c28]/80">
                      Tanggal Survey Drone
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#123c28]/40" />
                      <input
                        type="date"
                        name="survey_date"
                        className="w-full rounded-xl border border-[#123c28]/15 bg-[#fafbf8] py-2.5 pl-10 pr-3 text-sm font-medium text-[#123c28] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#123c28]"
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-xs font-bold text-[#123c28]/80">
                      Deskripsi Tambahan (Opsional)
                    </label>
                    <textarea
                      name="description"
                      className="w-full resize-none rounded-xl border border-[#123c28]/15 bg-[#fafbf8] px-3 py-2.5 text-sm font-medium text-[#123c28] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#123c28]"
                      rows={3}
                      placeholder="Informasi ketinggian terbang, sensor kamera, dsb..."
                    ></textarea>
                  </div>
                </div>
              </section>

              {/* Access Control */}
              <section className="rounded-[28px] border border-[#123c28]/15 bg-white p-5 sm:p-7">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed]">
                    <Lock className="h-4 w-4 text-[#123c28]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/75">
                    MONETISASI
                  </span>
                </div>
                <h2 className="mb-5 text-xl font-bold tracking-[-0.03em]">
                  Aturan Akses & Monetisasi DaaS
                </h2>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#123c28]/10 bg-[#fafbf8] p-4 transition-colors hover:border-[#123c28]/25 hover:bg-white">
                    <input
                      type="checkbox"
                      name="locked_for_free"
                      className="mt-0.5 h-4 w-4 rounded border-[#123c28]/30 text-[#123c28] focus:ring-[#123c28]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#123c28]">
                        Kunci untuk Member Free
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-[#123c28]/70">
                        Hanya member berbayar (Tier Desa/Kecamatan) yang dapat
                        mengakses data peta ini
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#123c28]/10 bg-[#fafbf8] p-4 transition-colors hover:border-[#123c28]/25 hover:bg-white">
                    <input
                      type="checkbox"
                      name="purchasable"
                      className="mt-0.5 h-4 w-4 rounded border-[#123c28]/30 text-[#123c28] focus:ring-[#123c28]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#123c28]">
                        Tersedia untuk Pembelian Satuan (Pay-per-view)
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-[#123c28]/70">
                        User dapat membeli akses peta ini secara terpisah tanpa
                        langganan
                      </p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Result Message: Rejection Diagnosis Card */}
              {!isSuccess && (geoError || message) && (
                <section className="rounded-[28px] border border-red-200 bg-red-50/80 p-5 text-red-950 shadow-sm sm:p-7">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-100 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-3 text-sm">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="rounded-full border border-red-300 bg-red-200/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-red-900">
                            {geoError?.error_type || "VALIDASI DITOLAK"}
                          </span>
                          <span className="text-[11px] font-semibold text-red-700">
                            Standard DaaS GIS Integrity
                          </span>
                        </div>
                        <h4 className="text-base font-bold leading-snug text-red-900">
                          {geoError?.message ||
                            message ||
                            "Gagal Memproses File Peta"}
                        </h4>
                      </div>

                      {/* File Characteristics Detected */}
                      {geoError?.details?.file_characteristics && (
                        <div className="space-y-2 rounded-2xl border border-red-200 bg-white/90 p-3.5 text-xs">
                          <p className="flex items-center gap-1.5 font-bold text-[#123c28]">
                            <Info className="h-4 w-4 text-red-600" />
                            Karakteristik File yang Terdeteksi oleh Engine GIS:
                          </p>
                          <div className="grid gap-2 text-[11px] text-[#123c28]/80 sm:grid-cols-2">
                            <div className="rounded-lg border border-red-100 bg-red-50/60 p-2">
                              <span className="block text-[#123c28]/50">
                                Status Proyeksi (CRS):
                              </span>
                              <span className="font-bold text-red-700">
                                {geoError.details.file_characteristics.crs}
                              </span>
                            </div>
                            {geoError.details.file_characteristics
                              .gps_metadata && (
                              <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-2">
                                <span className="block text-[#123c28]/50">
                                  Metadata GPS Kamera:
                                </span>
                                <span className="font-semibold text-amber-900">
                                  {
                                    geoError.details.file_characteristics
                                      .gps_metadata
                                  }
                                </span>
                              </div>
                            )}
                            {geoError.details.file_characteristics
                              .dimensions && (
                              <div className="rounded-lg border border-[#123c28]/10 bg-[#fafbf8] p-2">
                                <span className="block text-[#123c28]/50">
                                  Dimensi & Saluran:
                                </span>
                                <span className="font-semibold text-[#123c28]">
                                  {
                                    geoError.details.file_characteristics
                                      .dimensions
                                  }
                                </span>
                              </div>
                            )}
                            {geoError.details.file_characteristics
                              .camera_source && (
                              <div className="rounded-lg border border-[#123c28]/10 bg-[#fafbf8] p-2">
                                <span className="block text-[#123c28]/50">
                                  Sumber Perangkat:
                                </span>
                                <span className="font-semibold text-[#123c28]">
                                  {
                                    geoError.details.file_characteristics
                                      .camera_source
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Missing Requirements List */}
                      {geoError?.details?.missing_requirements &&
                        geoError.details.missing_requirements.length > 0 && (
                          <div className="rounded-2xl border border-red-200 bg-red-100/50 p-3 text-xs">
                            <p className="mb-1.5 flex items-center gap-1.5 font-bold text-red-900">
                              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                              Kekurangan / Komponen yang Hilang:
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-[11px] text-red-800">
                              {geoError.details.missing_requirements.map(
                                (item, idx) => (
                                  <li key={idx}>{item}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      {/* Why Rejected Rationale */}
                      {geoError?.details?.why_rejected && (
                        <p className="rounded-2xl border border-red-100 bg-white/70 p-3 text-xs leading-relaxed text-red-800">
                          <strong>Mengapa ditolak:</strong>{" "}
                          {geoError.details.why_rejected}
                        </p>
                      )}

                      {/* Solution / Action Required */}
                      {geoError?.details?.solution && (
                        <div className="rounded-2xl border border-red-200 bg-white p-3 text-xs text-[#123c28]/85 shadow-sm">
                          <p className="mb-1 flex items-center gap-1.5 font-bold text-red-800">
                            Langkah Solusi & Panduan Pengolahan:
                          </p>
                          <p className="text-[11px] leading-relaxed text-[#123c28]/70">
                            {geoError.details.solution}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Result Message: Approval Feedback Card */}
              {isSuccess && geoSuccess && (
                <section className="overflow-hidden rounded-[28px] bg-[#123c28] p-5 text-white shadow-sm sm:p-7">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-4 text-sm">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                            Validasi Spasial Lolos
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-100">
                            100% Standar DaaS Orthomosaic
                          </span>
                        </div>
                        <h4 className="text-base font-bold">
                          {geoSuccess.title ||
                            "Peta Berhasil Divalidasi & Disimpan!"}
                        </h4>
                        <p className="mt-0.5 text-xs font-medium text-emerald-100">
                          Metadata geospasial telah diverifikasi. Engine{" "}
                          <code className="rounded bg-white/15 px-1 py-0.5 font-mono text-[11px]">
                            rio-tiler
                          </code>{" "}
                          siap menyajikan Slippy Map XYZ tiles secara instan.
                        </p>
                      </div>

                      {/* Verified Metadata Grid */}
                      {geoSuccess.metadata && (
                        <div className="rounded-2xl border border-white/15 bg-white/95 p-4 text-[#123c28] shadow-sm">
                          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold">
                            <Compass className="h-4 w-4 text-[#1a5134]" />
                            Struktur & Metadata Geospasial Terverifikasi:
                          </p>
                          <div className="grid gap-2.5 text-xs sm:grid-cols-2 md:grid-cols-3">
                            <div className="rounded-lg border border-[#123c28]/10 bg-[#fafbf8] p-2.5">
                              <span className="block text-[10px] font-medium uppercase tracking-wider text-[#123c28]/50">
                                Proyeksi (CRS)
                              </span>
                              <span
                                className="block truncate text-xs font-bold text-[#1a5134]"
                                title={geoSuccess.metadata.crs}
                              >
                                {geoSuccess.metadata.crs}
                              </span>
                            </div>
                            <div className="rounded-lg border border-[#123c28]/10 bg-[#fafbf8] p-2.5">
                              <span className="block text-[10px] font-medium uppercase tracking-wider text-[#123c28]/50">
                                Dimensi Piksel
                              </span>
                              <span className="text-xs font-bold text-[#123c28]">
                                {geoSuccess.metadata.width.toLocaleString()} ×{" "}
                                {geoSuccess.metadata.height.toLocaleString()} px
                              </span>
                            </div>
                            <div className="rounded-lg border border-[#123c28]/10 bg-[#fafbf8] p-2.5">
                              <span className="block text-[10px] font-medium uppercase tracking-wider text-[#123c28]/50">
                                Saluran / Band
                              </span>
                              <span className="text-xs font-bold text-[#123c28]">
                                {geoSuccess.metadata.bands} Band (
                                {geoSuccess.metadata.dtypes.join(", ")})
                              </span>
                            </div>
                            <div className="rounded-lg border border-[#123c28]/10 bg-[#fafbf8] p-2.5">
                              <span className="block text-[10px] font-medium uppercase tracking-wider text-[#123c28]/50">
                                Driver / Tiling
                              </span>
                              <span className="text-xs font-bold text-[#123c28]">
                                {geoSuccess.metadata.driver}{" "}
                                {geoSuccess.metadata.is_tiled
                                  ? "(COG Tiled)"
                                  : "(Standar)"}
                              </span>
                            </div>
                            {geoSuccess.metadata.bounds_wgs84 && (
                              <div className="rounded-lg border border-[#123c28]/10 bg-[#fafbf8] p-2.5 sm:col-span-2">
                                <span className="block text-[10px] font-medium uppercase tracking-wider text-[#123c28]/50">
                                  Batas Koordinat WGS 84 (Bbox)
                                </span>
                                <span className="block font-mono text-[11px] font-semibold text-[#123c28]/85">
                                  [{geoSuccess.metadata.bounds_wgs84.min_lat}°,{" "}
                                  {geoSuccess.metadata.bounds_wgs84.min_lon}°]
                                  s/d [
                                  {geoSuccess.metadata.bounds_wgs84.max_lat}°,{" "}
                                  {geoSuccess.metadata.bounds_wgs84.max_lon}°]
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
                          className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-[#123c28] shadow-sm transition hover:bg-white/95"
                        >
                          Buka di Peta (Dashboard)
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSuccess(false);
                            setGeoSuccess(null);
                            setMessage("");
                          }}
                          className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                        >
                          Unggah File Peta Lain
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#123c28] py-3.5 text-sm font-semibold text-white transition hover:bg-[#1a5134] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Memproses & Memvalidasi...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Validasi & Unggah Peta
                  </>
                )}
              </button>
            </form>
          </div>

          {/* =====================================================
              SIDEBAR
          ====================================================== */}
          <div className="space-y-6">
            {/* Geospatial SOP Card */}
            <section className="rounded-[28px] border border-[#123c28]/15 bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed]">
                  <Compass className="h-4 w-4 text-[#123c28]" />
                </div>
                <h3 className="text-sm font-bold text-[#123c28]">
                  Standar Data Geospasial
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs font-medium text-[#123c28]/75">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold text-[#1a5134]">•</span>
                  <span>
                    <strong className="text-[#123c28]">Format Wajib:</strong>{" "}
                    GeoTIFF Orthomosaic (.tif/.tiff)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold text-[#1a5134]">•</span>
                  <span>
                    <strong className="text-[#123c28]">
                      Sistem Koordinat:
                    </strong>{" "}
                    WGS 84 / UTM / EPSG:3857
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold text-[#1a5134]">•</span>
                  <span>
                    <strong className="text-[#123c28]">Ukuran Maksimal:</strong>{" "}
                    5 GB per file peta
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold text-[#1a5134]">•</span>
                  <span>
                    <strong className="text-[#123c28]">Resolusi Bit:</strong>{" "}
                    8-bit UInt8 (RGB / Multispektral)
                  </span>
                </li>
              </ul>
            </section>

            {/* Supported Formats */}
            <section className="rounded-[28px] border border-[#123c28]/15 bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed]">
                  <FileText className="h-4 w-4 text-[#123c28]" />
                </div>
                <h3 className="text-sm font-bold text-[#123c28]">
                  Format yang Didukung
                </h3>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    ext: "GeoTIFF (.tif / .tiff)",
                    desc: "Wajib untuk Peta Spasial Ber-CRS (WGS84 / UTM)",
                    icon: <Compass className="h-4 w-4" />,
                  },
                  {
                    ext: "Cloud Optimized GeoTIFF (COG)",
                    desc: "Sangat direkomendasikan untuk kecepatan tiling",
                    icon: <ShieldCheck className="h-4 w-4" />,
                  },
                ].map((format, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-2xl border border-[#123c28]/10 bg-[#fafbf8] p-3"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#eef3e8] text-[#1a5134]">
                      {format.icon}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#123c28]">
                        {format.ext}
                      </span>
                      <span className="block text-[10px] font-medium text-[#123c28]/65">
                        {format.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Storage Info */}
            <section className="rounded-[28px] bg-[#f3f6ed] p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Database className="h-4 w-4 text-[#123c28]" />
                </div>
                <h3 className="text-sm font-bold text-[#123c28]">
                  Storage Server DaaS
                </h3>
              </div>
              <div className="mb-3">
                <div className="mb-1.5 flex justify-between text-xs font-medium text-[#123c28]/75">
                  <span>Penyimpanan Server</span>
                  <span className="font-bold text-[#123c28]">
                    Maks 5 GB / File
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white">
                  <div
                    className="h-1.5 rounded-full bg-[#123c28]"
                    style={{ width: "25%" }}
                  ></div>
                </div>
              </div>
              <p className="text-xs font-medium text-[#123c28]/70">
                Peta akan otomatis diproses ke format XYZ Tile Layer untuk
                Leaflet.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
