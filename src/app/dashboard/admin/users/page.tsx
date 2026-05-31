"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { users } from "@/lib/dummy-data";
import { formatDate, getInitials } from "@/lib/utils";
import {
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Mail,
  Phone,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";

export default function UserManagementPage() {
  const { t } = useLanguage();
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      searchQuery === "" ||
      `${u.firstName} ${u.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "landlord":
        return "bg-blue-100 text-blue-700";
      case "tenant":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <>
      <Header title={t("admin", "userManagement")} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {["tenant", "landlord", "admin"].map(
            (role) => (
              <div
                key={role}
                className="bg-white rounded-xl border border-slate-200 p-4 text-center"
              >
                <p className="text-2xl font-bold text-slate-900">
                  {users.filter((u) => u.role === role).length}
                </p>
                <p className="text-xs text-slate-500">
                  {t("roles", role)}
                </p>
              </div>
            )
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none"
            >
              <option value="all">All Roles</option>
              <option value="tenant">Tenants</option>
              <option value="landlord">Landlords</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-3">
                    User
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-3">
                    Contact
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-3">
                    Role
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-6 py-3">
                    Registered
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs">
                          {getInitials(
                            `${user.firstName} ${user.lastName}`
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {user.idNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {user.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                      >
                        {t("roles", user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <Shield className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <ShieldAlert className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
