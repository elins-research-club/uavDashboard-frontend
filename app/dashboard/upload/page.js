"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  MapPin,
  Lock,
  CheckCircle,
  AlertCircle,
  Image,
  File,
  Database,
  Calendar,
  Info,
  X,
  Folder,
} from "lucide-react";

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoading(false);
          alert("Upload berhasil! Data peta telah ditambahkan.");
          setSelectedFile(null);
          e.target.reset();
          return 0;
        }
        return prev + 10;
      });
    }, 200);
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
            Upload file peta dan atur aksesibilitas data untuk pengguna
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Upload Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  File Peta
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : selectedFile
                      ? "border-green-500 bg-green-50"
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
                    className="hidden"
                    accept=".tiff,.tif,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center border border-green-200">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
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
                        className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Folder className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        Drag & drop file atau
                      </p>
                      <label
                        htmlFor="fileUpload"
                        className="inline-block bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        Pilih File
                      </label>
                      <p className="text-xs text-gray-500 mt-3">
                        Format: .tiff, .tif, .png, .jpg (Max: 100MB)
                      </p>
                    </>
                  )}
                </div>

                {/* Upload Progress */}
                {loading && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-900">
                        Mengunggah file...
                      </span>
                      <span className="text-xs font-semibold text-blue-600">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Detail Peta
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
                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900"
                        placeholder="Contoh: Peta NPK Desa Sriharjo - Nov 2025"
                        required
                      />
                    </div>
                  </div>

                  {/* Location Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Lokasi
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900"
                        placeholder="Contoh: Desa Sriharjo, Kec. Imogiri"
                        required
                      />
                    </div>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Tanggal Survey
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Type Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Tipe Peta
                    </label>
                    <select className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900">
                      <option>NDVI (Vegetasi)</option>
                      <option>Soil Analysis (NPK)</option>
                      <option>Topography</option>
                      <option>Fertility</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Deskripsi (Opsional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900 resize-none"
                      rows="3"
                      placeholder="Tambahkan deskripsi detail tentang peta ini..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Access Control */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Aturan Akses & Monetisasi
                  </h3>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-0.5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Kunci untuk Member Free
                      </p>
                      <p className="text-xs text-gray-600">
                        Hanya member berbayar yang dapat mengakses peta ini
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-0.5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Tersedia untuk Pembelian Satuan
                      </p>
                      <p className="text-xs text-gray-600">
                        User dapat membeli akses peta ini secara terpisah
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Unggah Peta
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            {/* Upload Tips */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Tips Upload
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Gunakan format TIFF untuk kualitas terbaik</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Pastikan file tidak melebihi 100MB</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Berikan nama yang deskriptif dan tanggal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Verifikasi koordinat sebelum upload</span>
                </li>
              </ul>
            </div>

            {/* Supported Formats */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Format Didukung
              </h3>
              <div className="space-y-2">
                {[
                  {
                    ext: "TIFF",
                    desc: "Recommended",
                    icon: <Image className="w-4 h-4" />,
                    color: "text-green-600 bg-green-50 border-green-200",
                  },
                  {
                    ext: "PNG",
                    desc: "Good quality",
                    icon: <Image className="w-4 h-4" />,
                    color: "text-blue-600 bg-blue-50 border-blue-200",
                  },
                  {
                    ext: "JPG",
                    desc: "Compressed",
                    icon: <File className="w-4 h-4" />,
                    color: "text-gray-600 bg-gray-50 border-gray-200",
                  },
                ].map((format, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-lg border ${format.color}`}
                  >
                    <div className="flex items-center gap-2">
                      <div>{format.icon}</div>
                      <span className="text-xs font-medium">.{format.ext}</span>
                    </div>
                    <span className="text-xs text-gray-500">{format.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Storage Anda
                </h3>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-600">Terpakai</span>
                  <span className="font-semibold text-gray-900">
                    176 MB / 500 MB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gray-900 h-1.5 rounded-full"
                    style={{ width: "35%" }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Upgrade ke tier berbayar untuk storage hingga 50 GB
              </p>
            </div>

            {/* Quick Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Statistik Upload
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Total Peta</span>
                  <span className="font-medium text-gray-900">12</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Bulan Ini</span>
                  <span className="font-medium text-gray-900">3</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Minggu Ini</span>
                  <span className="font-medium text-gray-900">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
