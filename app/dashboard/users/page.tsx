"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";
import api from "@/lib/api";
import { useUserRole } from "@/context/UserRoleContext";

type Subscription = {
  tier: string;
  status: string;
  end_date?: string | null;
};

type UserRecord = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "member";
  created_at: string;
  subscription?: Subscription | null;
};

type SortKey = "username" | "email" | "created_at" | "role" | "tier" | "status" | "remaining";
type SortDirection = "asc" | "desc";
type SubscriptionState = "active" | "expiring" | "free" | "expired";

const TIER_OPTIONS = ["free", "desa", "kecamatan"];
const PAGE_SIZE = 10;
const TIER_STYLES: Record<string, string> = {
  free: "bg-[#eef1ea] text-[#385246]",
  desa: "bg-[#e5f1ed] text-[#176b5b]",
  kecamatan: "bg-[#fff1d8] text-[#8a5a06]",
};
const STATUS_STYLES: Record<SubscriptionState, string> = {
  active: "bg-emerald-50 text-emerald-800",
  expiring: "bg-amber-50 text-amber-800",
  free: "bg-slate-100 text-slate-700",
  expired: "bg-red-50 text-red-800",
};

export default function UsersPage() {
  const router = useRouter();
  const { user } = useUserRole();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("error");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    if (!user) return;

    api.get("/admin/users")
      .then(({ data }) => setUsers(data))
      .catch((error) => setMessage(error.response?.data?.detail || "Gagal memuat daftar user."))
      .finally(() => setLoading(false));
  }, [router, user]);

  const getState = (item: UserRecord): SubscriptionState => {
    const subscription = item.subscription;
    if (!subscription || subscription.tier === "free") return "free";
    const endDate = subscription.end_date ? new Date(subscription.end_date) : null;
    if (subscription.status === "expired" || (endDate && endDate <= new Date())) return "expired";
    if (endDate && endDate.getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000) return "expiring";
    return "active";
  };

  const remaining = (item: UserRecord) => {
    const subscription = item.subscription;
    if (!subscription || subscription.tier === "free") return "Selamanya";
    if (!subscription.end_date) return "Tidak terbatas";
    const days = Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000);
    return days <= 0 ? "Berakhir" : `${days} hari`;
  };

  const sortedUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users
      .filter((item) => `${item.username} ${item.email} ${item.role} ${item.subscription?.tier || "free"}`.toLowerCase().includes(query))
      .sort((first, second) => {
        const firstValue = sortKey === "status" ? getState(first) : sortKey === "remaining" ? remaining(first) : sortKey === "tier" ? first.subscription?.tier || "free" : first[sortKey];
        const secondValue = sortKey === "status" ? getState(second) : sortKey === "remaining" ? remaining(second) : sortKey === "tier" ? second.subscription?.tier || "free" : second[sortKey];
        const result = String(firstValue).localeCompare(String(secondValue), "id", { numeric: true });
        return sortDirection === "asc" ? result : -result;
      });
  }, [users, search, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
  const visibleUsers = sortedUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const stats = {
    active: users.filter((item) => getState(item) === "active").length,
    expiring: users.filter((item) => getState(item) === "expiring").length,
    free: users.filter((item) => getState(item) === "free").length,
    expired: users.filter((item) => getState(item) === "expired").length,
  };

  const sortBy = (key: SortKey) => {
    if (sortKey === key) setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDirection("asc"); }
    setPage(1);
  };

  const updateRole = async (id: string, role: UserRecord["role"]) => {
    setUpdatingId(id);
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      setUsers((current) => current.map((item) => item.id === id ? data : item));
      showMessage(`Role user berhasil diubah ke "${role}"`, "success");
    } catch (error: any) {
      showMessage(error.response?.data?.detail || "Role user gagal diubah.", "error");
    } finally { setUpdatingId(""); }
  };

  const updateTier = async (id: string, tier: string) => {
    setUpdatingId(`${id}-tier`);
    try {
      await api.patch(`/admin/users/${id}/tier`, { tier });
      setUsers((current) => current.map((item) => item.id === id ? { ...item, subscription: { ...(item.subscription || {}), tier, status: "active" } } : item));
      showMessage(`Tier subscription berhasil diubah ke "${tier}"`, "success");
    } catch (error: any) {
      showMessage(error.response?.data?.detail || "Gagal mengubah tier.", "error");
    } finally { setUpdatingId(""); }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMsgType(type); setMessage(text); window.setTimeout(() => setMessage(""), 3000);
  };

  const exportExcel = () => {
    const rows = sortedUsers.map((item) => [item.username, item.email, item.role, item.subscription?.tier || "free", getState(item), remaining(item), new Date(item.created_at).toLocaleDateString("id-ID")]);
    const csv = ["Nama,Email,Role,Tier,Status,Sisa Langganan,Tanggal Daftar", ...rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = "daftar-user.csv"; link.click(); URL.revokeObjectURL(link.href); setExportOpen(false);
  };

  const exportPdf = () => {
    const rows = sortedUsers.map((item) => `<tr><td>${item.username}</td><td>${item.email}</td><td>${item.role}</td><td>${item.subscription?.tier || "free"}</td><td>${getState(item)}</td><td>${remaining(item)}</td></tr>`).join("");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Daftar User</title><style>body{font-family:Arial;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#eef3e8}</style></head><body><h1>Daftar User AMX UAV DaaS</h1><table><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Tier</th><th>Status</th><th>Sisa</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close(); printWindow.focus(); printWindow.print(); printWindow.close(); setExportOpen(false);
  };

  if (user?.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-[#f3f6f4] text-[#123c28]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em]">UAV DaaS Platform</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Manajemen User</h1></div>
          <div className="relative"><button type="button" onClick={() => setExportOpen(!exportOpen)} className="inline-flex items-center gap-2 rounded-xl border border-[#123c28]/15 bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:bg-[#eef3e8]"><Download className="h-4 w-4" />Export<ChevronDown className="h-4 w-4" /></button>{exportOpen && <div className="absolute right-0 z-10 mt-2 w-48 rounded-2xl border border-[#123c28]/10 bg-white p-1.5 shadow-xl"><button type="button" onClick={exportPdf} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-[#eef3e8]"><FileText className="h-4 w-4" />PDF</button><button type="button" onClick={exportExcel} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-[#eef3e8]"><FileSpreadsheet className="h-4 w-4" />Excel (CSV)</button></div>}</div>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["active", "Active Users", stats.active, "text-emerald-700"], ["expiring", "Hampir Berakhir", stats.expiring, "text-amber-700"], ["free", "User Free", stats.free, "text-slate-700"], ["expired", "Langganan Expired", stats.expired, "text-red-700"]].map(([key, label, value, color]) => <button key={String(key)} type="button" onClick={() => { setSearch(key === "free" ? "free" : ""); setSortKey("status"); setPage(1); }} className="rounded-2xl border border-[#123c28]/10 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="flex items-center justify-between"><span className="text-sm font-semibold">{label}</span><Users className={`h-5 w-5 ${color}`} /></div><strong className={`mt-2 block text-2xl ${color}`}>{value}</strong></button>)}</div>

        {message && <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${msgType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}

        <section className="overflow-hidden rounded-3xl border border-[#123c28]/10 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#123c28]/10 p-4"><div className="flex items-center gap-2"><h2 className="text-base font-bold">Semua Pengguna</h2><span className="rounded-full bg-[#eef3e8] px-2.5 py-1 text-xs font-bold">{sortedUsers.length}</span></div><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama atau email..." className="w-full rounded-xl border border-[#123c28]/15 px-3 py-2.5 text-sm outline-none focus:border-[#277f6d] sm:w-72" /></div>
          {loading ? <div className="p-12 text-center text-sm font-semibold">Memuat daftar user...</div> : <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left"><thead className="border-b border-[#123c28]/10 bg-[#fafbf8]"><tr>{[["username", "User"], ["email", "Email"], ["created_at", "Terdaftar"], ["role", "Role"], ["tier", "Tier"], ["status", "Status"], ["remaining", "Sisa Langganan"]].map(([key, label]) => <th key={key} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#385246]"><button type="button" onClick={() => sortBy(key as SortKey)} className="inline-flex items-center gap-1.5">{label}{sortKey === key ? (sortDirection === "asc" ? <ArrowUpAZ className="h-3.5 w-3.5" /> : <ArrowDownAZ className="h-3.5 w-3.5" />) : <ArrowDownAZ className="h-3.5 w-3.5 opacity-30" />}</button></th>)}</tr></thead><tbody className="divide-y divide-[#123c28]/8">{visibleUsers.map((item) => { const state = getState(item); const tier = item.subscription?.tier || "free"; return <tr key={item.id} className="transition-colors hover:bg-[#fafbf8]"><td className="px-4 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#123c28] text-xs font-bold text-white">{item.username.slice(0, 2).toUpperCase()}</div><div><p className="text-sm font-bold">{item.username}</p>{item.id === user?.id && <span className="text-xs font-semibold text-[#277f6d]">Anda</span>}</div></div></td><td className="px-4 py-4 text-sm">{item.email}</td><td className="px-4 py-4 text-sm">{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td><td className="px-4 py-4"><select value={item.role} disabled={updatingId === item.id || item.id === user?.id} onChange={(event) => updateRole(item.id, event.target.value as UserRecord["role"])} className="rounded-lg border border-[#123c28]/15 px-2.5 py-2 text-sm font-semibold"><option value="member">Member</option><option value="admin">Admin</option></select></td><td className="px-4 py-4"><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${TIER_STYLES[tier] || TIER_STYLES.free}`}>{tier}</span><select value={tier} disabled={updatingId === `${item.id}-tier`} onChange={(event) => updateTier(item.id, event.target.value)} className="rounded-lg border border-[#123c28]/15 px-2 py-2 text-sm"><option value={TIER_OPTIONS[0]}>Free</option><option value={TIER_OPTIONS[1]}>Desa</option><option value={TIER_OPTIONS[2]}>Kecamatan</option></select></div></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLES[state]}`}>{state === "expiring" ? "Hampir habis" : state}</span></td><td className="px-4 py-4 text-sm font-semibold">{remaining(item)}{item.subscription?.end_date && <span className="block text-xs font-normal">s/d {new Date(item.subscription.end_date).toLocaleDateString("id-ID")}</span>}</td></tr>; })}</tbody></table></div>}
          {!loading && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#123c28]/10 px-4 py-3 text-sm"><span>Menampilkan {sortedUsers.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, sortedUsers.length)} dari {sortedUsers.length}</span><div className="flex items-center gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-[#123c28]/15 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><span className="font-bold">{page} / {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-[#123c28]/15 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></div>}
        </section>
      </div>
    </main>
  );
}
