"use client";

/* ============================================================
   PANEL — AKUN

   Profil (PATCH /api/users/me), ganti password
   (POST /api/users/me/password), dan kontrol sesi.
============================================================ */

import { useEffect, useState } from "react";
import {
  CalendarDays,
  KeyRound,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import api from "@/lib/api";
import { useFormatDate } from "@/lib/format";
import { dispatchToast } from "@/lib/notify";
import { useUserRole } from "@/context/UserRoleContext";

import { InfoItem, SectionHeader, TextField } from "./settings-ui";

const MIN_PASSWORD_LENGTH = 6;

export function AccountPanel({ onLogout }: { onLogout: () => void }) {
  const { user, refreshCurrentUser } = useUserRole();
  const formatDate = useFormatDate();

  /* ----------------------------------------------------------
     PROFIL — draft nama
  ---------------------------------------------------------- */

  const [username, setUsername] = useState(user?.username || "");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setUsername(user?.username || "");
  }, [user?.username]);

  const usernameDirty = username.trim() !== (user?.username || "");

  const handleSaveProfile = async () => {
    const next = username.trim();

    if (!next) {
      dispatchToast({
        title: "Nama tidak boleh kosong",
        message: "Isi nama tampil Anda sebelum menyimpan.",
        tone: "error",
      });
      return;
    }

    setSavingProfile(true);

    try {
      await api.patch("/users/me", { username: next });

      await refreshCurrentUser();

      dispatchToast({
        title: "Profil diperbarui",
        message: `Nama tampil kini "${next}".`,
        tone: "success",
      });
    } catch (error: unknown) {
      const detail = (
        error as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;

      dispatchToast({
        title: "Gagal memperbarui profil",
        message: detail || "Terjadi kesalahan jaringan. Coba lagi.",
        tone: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  };
  /* ----------------------------------------------------------
     GANTI PASSWORD
  ---------------------------------------------------------- */

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleClearPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      dispatchToast({
        title: "Isi seluruh kolom",
        message: "Password lama, baru, dan konfirmasi wajib diisi.",
        tone: "error",
      });
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      dispatchToast({
        title: "Password terlalu pendek",
        message: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`,
        tone: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      dispatchToast({
        title: "Konfirmasi tidak cocok",
        message: "Ulangi password baru pada kolom konfirmasi.",
        tone: "error",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const { data } = await api.post("/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      handleClearPassword();

      dispatchToast({
        title: "Password berhasil diubah",
        message:
          data?.message || "Gunakan password baru Anda pada login berikutnya.",
        tone: "success",
      });
    } catch (error: unknown) {
      const detail = (
        error as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;

      dispatchToast({
        title: "Gagal mengubah password",
        message: detail || "Periksa password lama Anda lalu coba lagi.",
        tone: "error",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Identity"
        title="Akun"
        description="Identitas akun, keamanan password, dan kontrol sesi perangkat ini."
        icon={UserRound}
      />

      {/* Info akun */}
      <div className="border border-[#DCDDD8] bg-white">
        <InfoItem icon={UserRound} label="Nama" value={user?.username || "-"} />

        <InfoItem icon={Mail} label="Email" value={user?.email || "-"} />

        <InfoItem
          icon={ShieldCheck}
          label="Role"
          value={user?.role || "member"}
        />

        <InfoItem
          icon={CalendarDays}
          label="Bergabung"
          value={user?.created_at ? formatDate(user.created_at) : "-"}
        />
      </div>

      {/* Edit nama */}
      <section>
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-[#171717] sm:text-sm">
            Ubah Nama Tampil
          </h3>

          <p className="mt-1 text-[10px] font-medium leading-4 text-[#858780] sm:text-xs">
            Nama ini tampil pada sidebar dan kartu profil.
          </p>
        </div>

        <div className="border border-[#DCDDD8] bg-white p-4 sm:p-5">
          <TextField
            icon={UsersRound}
            label="Nama tampil"
            description="Maksimal 60 karakter."
            value={username}
            placeholder={user?.username || "Nama Anda"}
            onChange={setUsername}
          />

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={!usernameDirty || savingProfile}
              className="inline-flex items-center justify-center gap-2 bg-[#171717] px-4 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-40 sm:text-xs"
            >
              {savingProfile ? (
                "Menyimpan…"
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" strokeWidth={2} />
                  Simpan profil
                </>
              )}
            </button>
          </div>
        </div>
      </section>
      {/* Ganti password */}
      <section>
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-[#171717] sm:text-sm">
            Ganti Password
          </h3>

          <p className="mt-1 text-[10px] font-medium leading-4 text-[#858780] sm:text-xs">
            Minimal {MIN_PASSWORD_LENGTH} karakter dan berbeda dari password
            lama.
          </p>
        </div>

        <div className="border border-[#DCDDD8] bg-white p-4 sm:p-5">
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#171717] sm:text-xs">
                <LockKeyhole className="h-3.5 w-3.5" strokeWidth={1.9} />
                Password lama
              </span>

              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="h-10 w-full border border-[#DCDDD8] bg-[#FAFAF8] px-3 text-[11px] font-semibold text-[#33332F] outline-none transition-colors focus:border-[#9A9B95] focus:bg-white sm:h-11 sm:text-xs"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#171717] sm:text-xs">
                <KeyRound className="h-3.5 w-3.5" strokeWidth={1.9} />
                Password baru
              </span>

              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-10 w-full border border-[#DCDDD8] bg-[#FAFAF8] px-3 text-[11px] font-semibold text-[#33332F] outline-none transition-colors focus:border-[#9A9B95] focus:bg-white sm:h-11 sm:text-xs"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold text-[#171717] sm:text-xs">
                Ulangi password baru
              </span>

              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-10 w-full border border-[#DCDDD8] bg-[#FAFAF8] px-3 text-[11px] font-semibold text-[#33332F] outline-none transition-colors focus:border-[#9A9B95] focus:bg-white sm:h-11 sm:text-xs"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleClearPassword}
              className="inline-flex items-center justify-center gap-2 border border-[#DCDDD8] bg-white px-4 py-2.5 text-[11px] font-bold text-[#6B6B66] transition-colors hover:bg-[#F4F5F2] hover:text-[#171717] sm:text-xs"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Bersihkan
            </button>

            <button
              type="button"
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="inline-flex items-center justify-center gap-2 bg-[#171717] px-4 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-40 sm:text-xs"
            >
              {changingPassword ? (
                "Mengubah…"
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" strokeWidth={2} />
                  Ubah password
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Sesi */}
      <div className="border border-[#DCDDD8] bg-[#F8F9F6] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#171717] sm:text-sm">
              Akhiri sesi
            </p>

            <p className="mt-1 max-w-xl text-[11px] font-medium leading-[1.65] text-[#6B6B66] sm:text-xs sm:leading-5">
              Keluar dari workspace pada perangkat ini.
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex w-full items-center justify-center gap-2 border border-red-200 bg-white px-4 py-2.5 text-[11px] font-bold text-red-700 transition-colors hover:bg-red-50 sm:w-auto sm:text-xs"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
