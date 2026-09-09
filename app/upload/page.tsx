"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UploadRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/upload");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#123c28] border-t-transparent" />
        <p className="text-xs font-semibold text-[#123c28]/70">
          Mengarahkan ke Halaman Upload Peta...
        </p>
      </div>
    </div>
  );
}