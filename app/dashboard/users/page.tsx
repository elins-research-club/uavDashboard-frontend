"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";
import api from "@/lib/api";
import { useUserRole } from "@/context/UserRoleContext";

type UserRecord = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "member";
  created_at: string;
};

export default function UsersPage() {
  const router = useRouter();
  const { user } = useUserRole();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");

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

  const updateRole = async (id: string, role: UserRecord["role"]) => {
    setUpdatingId(id);
    setMessage("");
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      setUsers((current) => current.map((item) => item.id === id ? data : item));
    } catch (error) {
      setMessage(error.response?.data?.detail || "Role user gagal diubah.");
    } finally {
      setUpdatingId("");
    }
  };

  if (user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-50 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
            <p className="text-sm text-gray-600">Kelola akun dan role akses platform.</p>
          </div>
        </div>

        {message && <p className="mb-4 text-sm text-red-600">{message}</p>}

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Memuat daftar user...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Terdaftar</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {item.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{item.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-6 py-4">
                        <label className="sr-only" htmlFor={`role-${item.id}`}>Role {item.username}</label>
                        <div className="flex items-center gap-2">
                          {item.role === "admin" && <ShieldCheck className="w-4 h-4 text-blue-600" />}
                          <select
                            id={`role-${item.id}`}
                            value={item.role}
                            disabled={updatingId === item.id || item.id === user.id}
                            onChange={(event) => updateRole(item.id, event.target.value as UserRecord["role"])}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
