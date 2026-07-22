"use client"; // wajib supaya hanya jalan di client

import dynamic from "next/dynamic";

// Import dinamis untuk mencegah SSR crash
const ActualMap = dynamic(() => import("./ActualMap"), { ssr: false });

export default function MapView() {
  return <ActualMap />;
}
