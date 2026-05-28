"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/dashboard/ui";
import { useLanguage } from "@/context/language-context";
import {
  apiListNotifications,
  apiMarkNotificationRead,
  apiMarkAllNotificationsRead,
  getAccessToken,
  type BackendNotification,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await apiListNotifications(token, "page=1&pageSize=100");
      setItems(res.items);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered =
    filter === "unread" ? items.filter((n) => !n.isRead) : items;
  const unreadCount = items.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    const token = getAccessToken();
    if (!token) return;
    await apiMarkAllNotificationsRead(token).catch(() => undefined);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    const token = getAccessToken();
    if (!token) return;
    await apiMarkNotificationRead(token, id).catch(() => undefined);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const getIcon = (type: BackendNotification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <PageHeader
        title={t("notificationsPage", "title")}
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread`
            : undefined
        }
      />
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilter("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      filter === "all"
                        ? "bg-primary-100 text-primary-700"
                        : "text-stone-500 hover:bg-stone-100"
                    )}
                  >
                    All ({items.length})
                  </button>
                  <button
                    onClick={() => setFilter("unread")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      filter === "unread"
                        ? "bg-primary-100 text-primary-700"
                        : "text-stone-500 hover:bg-stone-100"
                    )}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="space-y-2">
                {filtered.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "bg-white rounded-xl border p-4 flex items-start gap-4 transition-colors",
                      notification.isRead
                        ? "border-stone-200"
                        : "border-primary-200 bg-primary-50/30"
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={cn(
                            "text-sm",
                            notification.isRead
                              ? "text-stone-700"
                              : "text-stone-900 font-semibold"
                          )}
                        >
                          {notification.title}
                        </h3>
                        <span className="text-xs text-stone-400 shrink-0">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {notification.link && (
                          <Link
                            href={notification.link}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View Details
                          </Link>
                        )}
                        {!notification.isRead && (
                          <button
                            onClick={() => markRead(notification.id)}
                            className="text-xs text-stone-400 hover:text-stone-600"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <Bell className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-500 text-sm">No notifications</p>
                </div>
              )}
            </>
          )}
    </div>
  );
}
