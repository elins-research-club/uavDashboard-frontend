"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("Memverifikasi email...");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setMessage("Link verifikasi tidak lengkap.");
      return;
    }

    api.get("/auth/verify-email", { params: { token } })
      .then(({ data }) => setMessage(data.message))
      .catch((error) => setMessage(error.response?.data?.detail || "Link verifikasi tidak valid atau sudah kedaluwarsa."));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] p-6 text-white">
      <section className="w-full max-w-md border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-xl font-bold">Verifikasi Email</h1>
        <p className="mt-3 text-sm text-white/65">{message}</p>
        <Link href="/login" className="mt-6 inline-flex bg-[#76B900] px-4 py-2 text-xs font-bold text-black">Ke halaman login</Link>
      </section>
    </main>
  );
}
