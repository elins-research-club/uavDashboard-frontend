"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Gem,
  MapPinned,
  Sparkles,
  Upload,
  Workflow,
} from "lucide-react";

const ICON_STROKE = 1.75;
const EASE = [0.22, 1, 0.36, 1] as const;

/* Ikon brand WhatsApp — lucide tidak menyediakan ikon brand,
   jadi pakai inline SVG (glyph resmi, viewBox 24, fill currentColor). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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

const steps = [
  {
    label: "Unggah GeoTIFF",
    desc: ".tif / .tiff · maks. 5 GB per file",
  },
  {
    label: "Tunggu validasi & konversi",
    desc: "PMTiles diproses di background, non-blocking",
  },
  {
    label: "Buka hasil di Peta Saya",
    desc: "Layer siap diatur opasitas & dianalisis",
  },
];

const quickLinks = [
  {
    href: "/dashboard/upload",
    title: "Unggah Dataset",
    desc: "Batch otomatis atau manual dengan validasi CRS.",
    icon: Upload,
  },
  {
    href: "/dashboard/maps",
    title: "Peta Saya",
    desc: "Kelola layer, opasitas, dan metadata geospasial.",
    icon: MapPinned,
  },
  {
    href: "/dashboard/subscription",
    title: "Langganan",
    desc: "Upgrade paket untuk akses layer premium.",
    icon: Gem,
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const supportMessage = encodeURIComponent(
    "Halo tim support, saya mengalami masalah pada dashboard UAV. Saya akan menyertakan screenshot masalahnya. Bisakah dibantu?\n\n_Pesan dari platform AMX GeoStream_"
  );

  return (
    <main className="bg-page min-h-screen text-brand-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER — pola sama dengan dashboard utama
        =================================================== */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>

            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-brand-900 sm:text-4xl">
              Pusat <span className="text-brand-600">Bantuan</span>
            </h1>

          </div>


        </header>

        {/* ==================================================
            BENTO GRID — FAQ span 8, sidebar span 4,
            quick links full width
        =================================================== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* ---------- FAQ ---------- */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
            className="glass p-5 sm:p-6 lg:col-span-8"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="icon-ring h-9 w-9">
                <BookOpen className="h-4 w-4" strokeWidth={ICON_STROKE} />
              </span>
              <div>
                <p className="micro-label">FAQ</p>
                <h2 className="text-sm font-bold text-brand-900">
                  Pertanyaan Umum
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={faq.question}
                    className={`overflow-hidden rounded-2xl border transition-all duration-300 ${isOpen
                      ? "border-brand-600/25 bg-white shadow-card"
                      : "border-brand-800/10 bg-white/50 hover:border-brand-800/20 hover:bg-white/80"
                      }`}
                  >
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${index}`}
                        id={`faq-button-${index}`}
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-bold text-brand-900 outline-none transition focus-visible:ring-2 focus-visible:ring-brand-600/40"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={`icon-ring h-7 w-7 flex-shrink-0 rounded-full text-xs font-bold transition-colors duration-300 ${isOpen ? "text-brand-600" : ""
                              }`}
                          >
                            {index + 1}
                          </span>
                          <span className="min-w-0">{faq.question}</span>
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-all duration-300 ${isOpen
                            ? "rotate-180 text-brand-600"
                            : "text-brand-800/45"
                            }`}
                          strokeWidth={ICON_STROKE}
                        />
                      </button>
                    </h3>

                    <div
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-button-${index}`}
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                    >
                      <div className="overflow-hidden">
                        <p
                          className={`border-t border-brand-800/8 py-4 pl-14 pr-4 text-sm leading-relaxed text-brand-800/75 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
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
          </motion.section>

          {/* ---------- SIDEBAR: ALUR CEPAT + SUPPORT ---------- */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            {/* Alur cepat — timeline bernomor, pola sama dengan
                activity list di dashboard utama */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
              className="glass p-5"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="icon-ring h-9 w-9">
                  <Workflow className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </span>
                <div>
                  <p className="micro-label">Workflow</p>
                  <h2 className="text-sm font-bold text-brand-900">
                    Alur Cepat
                  </h2>
                </div>
              </div>

              <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[18px] before:top-4 before:w-px before:bg-brand-800/10">
                {steps.map((step, index) => (
                  <li key={step.label} className="relative flex items-start gap-3">
                    <span className="icon-ring relative z-10 h-9 w-9 flex-shrink-0 rounded-full text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="min-w-0 pt-1">
                      <span className="block text-sm font-semibold text-brand-900">
                        {step.label}
                      </span>
                      <span className="mt-0.5 block text-xs font-medium leading-4 text-brand-800/55">
                        {step.desc}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </motion.section>

            {/* Support — kartu gelap dengan orb dekoratif,
                bahasa visual sama dengan stat card dashboard */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
              className="relative overflow-hidden rounded-3xl border border-brand-800/40 bg-brand-900 p-5 text-white shadow-glass-lg"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/25 blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-brand-400/15 blur-2xl"
              />

              <div className="relative">
                {/* Glass dikurangi sedikit: blur md→sm, bg white/10→15 (lebih solid) */}
                <span className="liquid-badge-dark bg-white/15 px-3 py-1 text-2xs font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
                  <WhatsAppIcon className="h-3 w-3" />
                  WhatsApp Support
                </span>

                <h2 className="mt-4 text-base font-bold">Butuh bantuan?</h2>
                <p className="mt-1.5 text-xs font-medium leading-5 text-white/70">
                  Sertakan judul survei dan pesan error agar tim dapat merespons
                  lebih cepat.
                </p>

                <a
                  href={`https://wa.me/6281398809336?text=${supportMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-brand-900 outline-none transition-all duration-200 hover:-translate-y-px hover:bg-brand-100 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  Hubungi Support
                </a>
              </div>
            </motion.section>
          </div>

          {/* ---------- QUICK LINKS — 3 kartu glass full width ---------- */}
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.24 + index * 0.06,
                ease: EASE,
              }}
              className="lg:col-span-4"
            >
              <Link
                href={link.href}
                className="group glass flex h-full items-start gap-4 p-5 outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-800/25 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-600/40"
              >
                <span className="icon-ring h-10 w-10 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:scale-105">
                  <link.icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-brand-900">
                      {link.title}
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 flex-shrink-0 text-brand-800/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-700"
                      strokeWidth={ICON_STROKE}
                    />
                  </span>
                  <span className="mt-1 block text-xs font-medium leading-5 text-brand-800/60">
                    {link.desc}
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
