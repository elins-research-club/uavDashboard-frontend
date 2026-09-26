"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Gem,
  MapPinned,
  Upload,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import scene from "@/components/HelpScene.module.css";

const ICON_STROKE = 1.75;
const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: EASE,
    },
  },
};

/* ============================================================
   WHATSAPP ICON
============================================================ */

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <motion.div
        whileHover={{
          y: -2,
          rotate: -4,
        }}
        transition={{
          duration: 0.22,
          ease: EASE,
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2] sm:h-10 sm:w-10"
      >
        <Icon className="h-4 w-4 text-[#33332F]" strokeWidth={ICON_STROKE} />
      </motion.div>

      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#858780] sm:text-[10px] sm:tracking-[0.15em]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-[15px] font-bold tracking-[-0.02em] text-[#171717] sm:text-base">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-2xl text-[11px] font-medium leading-[1.55] text-[#6B6B66] sm:text-xs sm:leading-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DATA
============================================================ */

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
    number: "01",
    label: "Unggah GeoTIFF",
    desc: ".tif / .tiff · maks. 5 GB per file",
  },
  {
    number: "02",
    label: "Tunggu validasi & konversi",
    desc: "PMTiles diproses di background secara non-blocking",
  },
  {
    number: "03",
    label: "Buka hasil di Peta Saya",
    desc: "Layer siap diatur opasitas dan dianalisis",
  },
];

const quickLinks = [
  {
    href: "/dashboard/upload",
    title: "Unggah Dataset",
    desc: "Batch otomatis atau manual dengan validasi CRS.",
    icon: Upload,
    meta: "Dataset",
  },
  {
    href: "/dashboard/maps",
    title: "Peta Saya",
    desc: "Kelola layer, opasitas, dan metadata geospasial.",
    icon: MapPinned,
    meta: "Maps",
  },
  {
    href: "/dashboard/subscription",
    title: "Langganan",
    desc: "Upgrade paket untuk akses layer premium.",
    icon: Gem,
    meta: "Plan",
  },
];

/* ============================================================
   PAGE
============================================================ */

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const supportMessage = encodeURIComponent(
    "Halo tim support, saya mengalami masalah pada dashboard UAV. Saya akan menyertakan screenshot masalahnya. Bisakah dibantu?\n\n_Pesan dari platform AMX GeoStream_"
  );

  return (
    <main className="min-h-screen bg-[#F4F5F2] text-[#171717]">
      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* ==================================================
            HEADER
        =================================================== */}

        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative mb-5 sm:mb-7"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
            <div className="min-w-0">
              <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.05em] text-[#171717] sm:text-4xl">
                Pusat Bantuan
              </h1>


            </div>

            <div className="flex items-end gap-2 sm:gap-4">
              <div className="hidden border-l border-[#DCDDD8] pl-4 sm:block">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#858780]">
                  Support Status
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <motion.span
                    animate={{
                      scale: [1, 1.15, 1],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="h-1.5 w-1.5 bg-[#76B900]"
                  />

                  <span className="text-xs font-bold text-[#33332F]">
                    Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* ==================================================
            MAIN CONTENT
        =================================================== */}

        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)] lg:gap-4">
          {/* ==================================================
              FAQ
          =================================================== */}

          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{
              delay: 0.05,
            }}
            className="min-w-0 border border-[#DCDDD8] bg-white"
          >
            <div className="border-b border-[#DCDDD8] px-4 py-4 sm:px-6 sm:py-5">
              <SectionHeader
                eyebrow="FAQ"
                title="Pertanyaan Umum"
                icon={BookOpen}
              />
            </div>

            <div className="p-3 sm:p-5">
              <div className="space-y-2">
                {faqs.map((faq, index) => {
                  const isOpen = openIndex === index;

                  return (
                    <motion.div
                      key={faq.question}
                      layout
                      className={`overflow-hidden border transition-colors duration-200 ${isOpen
                          ? "border-[#CFCFC8] bg-[#FAFAF8]"
                          : "border-[#DCDDD8] bg-white hover:bg-[#FAFAF8]"
                        }`}
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${index}`}
                        id={`faq-button-${index}`}
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="flex w-full items-start justify-between gap-3 px-3.5 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 sm:items-center sm:gap-4 sm:px-4 sm:py-4"
                      >
                        <span className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
                          <motion.span
                            animate={{
                              backgroundColor: isOpen ? "#171717" : "#F4F5F2",
                              color: isOpen ? "#FFFFFF" : "#6B6B66",
                            }}
                            className="flex h-7 w-7 shrink-0 items-center justify-center text-[9px] font-bold sm:text-[10px]"
                          >
                            {String(index + 1).padStart(2, "0")}
                          </motion.span>

                          <span
                            className={`min-w-0 text-[11px] font-bold leading-[1.55] sm:text-xs sm:leading-5 ${isOpen ? "text-[#171717]" : "text-[#33332F]"
                              }`}
                          >
                            {faq.question}
                          </span>
                        </span>

                        <motion.span
                          animate={{
                            rotate: isOpen ? 180 : 0,
                          }}
                          transition={{
                            duration: 0.22,
                            ease: EASE,
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DCDDD8] bg-white"
                        >
                          <ChevronDown
                            className="h-3.5 w-3.5 text-[#6B6B66]"
                            strokeWidth={ICON_STROKE}
                          />
                        </motion.span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={`faq-panel-${index}`}
                            role="region"
                            aria-labelledby={`faq-button-${index}`}
                            initial={{
                              height: 0,
                              opacity: 0,
                            }}
                            animate={{
                              height: "auto",
                              opacity: 1,
                            }}
                            exit={{
                              height: 0,
                              opacity: 0,
                            }}
                            transition={{
                              duration: 0.28,
                              ease: EASE,
                            }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-[#DCDDD8] px-3.5 py-3.5 pl-[46px] sm:px-4 sm:py-4 sm:pl-[52px]">
                              <p className="text-[11px] font-medium leading-[1.7] text-[#6B6B66] sm:text-xs sm:leading-6">
                                {faq.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* ==================================================
              RIGHT COLUMN
          =================================================== */}

          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            {/* Workflow */}

            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{
                delay: 0.11,
              }}
              className="min-w-0 border border-[#DCDDD8] bg-white"
            >
              <div className="border-b border-[#DCDDD8] px-4 py-4 sm:px-5 sm:py-5">
                <SectionHeader
                  eyebrow="Workflow"
                  title="Alur Cepat"
                  icon={Workflow}
                />
              </div>

              <div className="p-4 sm:p-5">
                <div className="relative">
                  <div className="absolute bottom-5 left-4 top-5 w-px bg-[#DCDDD8]" />

                  <div className="space-y-5">
                    {steps.map((step, index) => (
                      <motion.div
                        key={step.number}
                        initial={{
                          opacity: 0,
                          x: -8,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          duration: 0.35,
                          delay: 0.14 + index * 0.06,
                          ease: EASE,
                        }}
                        className="relative flex min-w-0 gap-3"
                      >
                        <motion.span
                          whileHover={{
                            scale: 1.08,
                            rotate: -4,
                          }}
                          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border ${index === steps.length - 1
                              ? "border-[#171717] bg-[#171717] text-white"
                              : "border-[#DCDDD8] bg-[#F4F5F2] text-[#33332F]"
                            }`}
                        >
                          <span className="text-[9px] font-bold">
                            {step.number}
                          </span>
                        </motion.span>

                        <div className="min-w-0 pt-0.5">
                          <p className="text-[11px] font-bold leading-5 text-[#171717] sm:text-xs">
                            {step.label}
                          </p>

                          <p className="mt-1 text-[9px] font-medium leading-[1.6] text-[#858780] sm:text-[10px] sm:leading-4">
                            {step.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Support */}

            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{
                delay: 0.17,
              }}
              className="relative border border-[#171717] bg-[#171717] p-4 text-white sm:p-5"
            >
              {/* Wireframe dekorasi: di-clip sendiri agar card tidak perlu overflow-hidden */}

              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 260 180"
                  className="absolute bottom-0 right-0 h-full w-[220px] opacity-70 sm:w-[240px]"
                >
                  <g
                    fill="none"
                    stroke="rgba(255,255,255,0.10)"
                    strokeWidth="1"
                  >
                    <path d="M70 38L150 18L218 44L140 68Z" />
                    <path d="M70 38V105L140 130V68" />
                    <path d="M140 68L218 44V108L140 130" />
                    <path d="M100 62L164 44L205 58L142 78Z" />
                  </g>
                </svg>
              </div>

              {/* 3D OBJECT: sebagian keluar dari card (naik ke atas) */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 right-2 z-20 origin-top-right scale-[0.82] sm:-top-7 sm:right-0 sm:scale-90 md:scale-100"
              >
                <div className={scene.scene}>
                  <div className={scene.shadow} />

                  <div className={scene.object}>
                    <span className={`${scene.face} ${scene.back}`} />
                    <span className={`${scene.face} ${scene.side}`} />
                    <span className={`${scene.face} ${scene.front}`}>?</span>
                  </div>

                  <span className={scene.orb} />
                  <span className={`${scene.orb} ${scene.small}`} />
                </div>
              </div>

              <div className="relative min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 border border-white/15 bg-white/5 px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.09em] text-white/75 sm:gap-2 sm:text-[9px] sm:tracking-[0.1em]">
                    <WhatsAppIcon className="h-3 w-3" />
                    WhatsApp Support
                  </span>
                </div>

                <h2 className="mt-4 text-[15px] font-bold sm:mt-5 sm:text-base">
                  Butuh bantuan?
                </h2>

                <p className="mt-1.5 max-w-sm text-[11px] font-medium leading-[1.65] text-white/60 sm:text-xs sm:leading-5">
                  Sertakan judul survei dan pesan error agar tim dapat membantu
                  lebih cepat.
                </p>

                <motion.a
                  href={`https://wa.me/6281398809336?text=${supportMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="mt-4 inline-flex items-center gap-2 bg-white px-3.5 py-2.5 text-[11px] font-bold text-[#171717] transition-colors hover:bg-[#F0F0EC] sm:mt-5 sm:px-4 sm:text-xs"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  Hubungi Support
                  <ArrowUpRight
                    className="h-3.5 w-3.5"
                    strokeWidth={ICON_STROKE}
                  />
                </motion.a>
              </div>
            </motion.section>
          </div>
        </div>

        {/* ==================================================
            QUICK LINKS
        =================================================== */}

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{
            delay: 0.22,
          }}
          className="mt-3 min-w-0 border border-[#DCDDD8] bg-white sm:mt-4"
        >
          <div className="border-b border-[#DCDDD8] px-4 py-4 sm:px-6 sm:py-5">
            <SectionHeader
              eyebrow="Navigation"
              title="Akses Cepat"
              icon={MapPinned}
            />
          </div>

          <div className="grid md:grid-cols-3">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex min-w-0 items-start gap-3.5 p-4 outline-none transition-colors hover:bg-[#FAFAF8] focus-visible:bg-[#FAFAF8] sm:gap-4 sm:p-5 ${index < quickLinks.length - 1
                      ? "border-b border-[#DCDDD8] md:border-b-0 md:border-r"
                      : ""
                    }`}
                >
                  <motion.span
                    whileHover={{
                      y: -3,
                      rotate: -4,
                    }}
                    transition={{
                      duration: 0.22,
                      ease: EASE,
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2] sm:h-10 sm:w-10"
                  >
                    <Icon
                      className="h-4 w-4 text-[#33332F]"
                      strokeWidth={ICON_STROKE}
                    />
                  </motion.span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2.5">
                      <span className="min-w-0 text-[13px] font-bold leading-5 text-[#171717] sm:text-sm">
                        {link.title}
                      </span>

                      <ArrowUpRight
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#B0B1AB] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#171717]"
                        strokeWidth={ICON_STROKE}
                      />
                    </span>

                    <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.1em] text-[#858780] sm:text-[10px]">
                      {link.meta}
                    </span>

                    <span className="mt-2 block text-[11px] font-medium leading-[1.65] text-[#6B6B66] sm:text-xs sm:leading-5">
                      {link.desc}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* ==================================================
            FOOTER
        =================================================== */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.4,
            duration: 0.5,
          }}
          className="mt-3 flex items-center justify-between gap-3 px-1 sm:mt-4 sm:gap-4"
        >
          <p className="text-[9px] font-medium leading-4 text-[#858780] sm:text-[10px]">
            AMX GeoStream · Help Center
          </p>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="h-1.5 w-1.5 bg-[#76B900]" />

            <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#858780] sm:text-[9px] sm:tracking-[0.12em]">
              System Available
            </span>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
