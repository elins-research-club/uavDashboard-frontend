"use client";

import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Mail,
  Map,
  Upload,
} from "lucide-react";

const faqs = [
  {
    question: "Bagaimana cara mengunggah dataset?",
    answer:
      "Buka Upload Peta, pilih Batch Otomatis atau Manual, unggah file GeoTIFF, lengkapi detail survei, lalu pilih Validasi & Unggah Dataset.",
  },
  {
    question: "Layer apa saja yang dapat digunakan?",
    answer:
      "Gunakan Ortho RGB sebagai layer dasar. Layer tambahan dapat berupa NDVI, VARI, Nitrogen, Fosfor, Kalium, DSM, multispektral, atau layer kustom.",
  },
  {
    question: "Mengapa peta belum tampil setelah upload?",
    answer:
      "Dataset sedang dikonversi ke PMTiles di background. Tunggu sampai proses selesai, lalu buka kembali Peta Saya.",
  },
  {
    question: "Apa yang harus dilakukan jika upload gagal?",
    answer:
      "Pastikan file berformat .tif atau .tiff, memiliki CRS yang valid, dan ukuran file tidak melebihi batas. Jika masih gagal, hubungi support dengan judul survei dan pesan error.",
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const legacySupportMessage = encodeURIComponent(
    "Halo tim support, saya mengalami masalah pada dashboard UAV. Saya akan menyertakan screenshot masalahnya. Bisakah dibantu?\n\n_Pesan dari platform AMX GeoStream_",
  );

  const supportMessage = encodeURIComponent(
    "Halo tim support, saya mengalami masalah pada dashboard UAV. Saya akan menyertakan screenshot masalahnya. Bisakah dibantu?\n\n_Pesan dari platform AMX GeoStream_",
  );
  void legacySupportMessage;

  return (
    <main className="min-h-full bg-[#f7f8f5] px-4 py-6 text-[#123c28] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#123c28] text-white">
            <CircleHelp className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pusat Bantuan
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#123c28]">
            Panduan singkat untuk mengelola dataset dan peta UAV.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
          <section className="rounded-3xl border border-[#123c28]/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-base font-bold">Pertanyaan Umum</h2>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={faq.question}
                    className="rounded-2xl border border-[#123c28]/10"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-bold"
                    >
                      {faq.question}
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                    >
                      <div className="overflow-hidden">
                        <p
                          className={`border-t border-[#123c28]/10 px-4 py-4 text-sm leading-relaxed text-[#123c28] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
                            }`}
                        >
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-[#123c28]/10 bg-[#eef3e8] p-5">
              <h2 className="text-sm font-bold">Alur cepat</h2>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex gap-3">
                  <Upload className="h-5 w-5 shrink-0" />
                  <span>Unggah GeoTIFF</span>
                </div>
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>Tunggu validasi dan konversi</span>
                </div>
                <div className="flex gap-3">
                  <Map className="h-5 w-5 shrink-0" />
                  <span>Buka hasil di Peta Saya</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#123c28] p-5 text-white">
              <Mail className="h-5 w-5" />
              <h2 className="mt-4 text-sm font-bold">Butuh bantuan?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white">
                Sertakan judul survei dan pesan error saat menghubungi tim.
              </p>
              <a
                href={`https://wa.me/6281398809336?text=${supportMessage}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#123c28]"
              >
                Hubungi Support
              </a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
