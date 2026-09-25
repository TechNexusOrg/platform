"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore network errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s check
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(
      unread.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: "POST" }))
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    setLoading(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sky-500 px-1 font-mono text-[10px] font-bold text-slate-950 shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-[#0d121f] p-4 shadow-2xl z-50 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-white tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.2 text-[10px] text-sky-400">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={loading}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 space-y-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-2.5 rounded-lg transition-colors space-y-1 ${
                    notif.isRead
                      ? "opacity-60 hover:opacity-100 hover:bg-slate-900/40"
                      : "bg-slate-900/80 border border-sky-500/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white">
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notif.id)}
                        className="text-[10px] text-sky-400 hover:underline shrink-0"
                      >
                        ✓ Read
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                    <span>
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                    {notif.linkUrl && (
                      <Link
                        href={notif.linkUrl}
                        onClick={() => {
                          if (!notif.isRead) markAsRead(notif.id);
                          setIsOpen(false);
                        }}
                        className="text-sky-400 hover:underline"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
