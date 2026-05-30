"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Settings, User, LogOut, Shield, Moon, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SearchLinkInput } from "@/components/layout/search-link";
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownChevron,
} from "@/components/ui/dropdown";
import { mockNotifications, currentUser } from "@/lib/mock-data";
import { RelativeTime } from "@/components/ui/relative-time";
import { Badge } from "@/components/ui/badge";
import { CommunitySwitcher } from "@/components/layout/community-switcher";

function sortNotificationsByPriority<T extends { read: boolean; type?: string; createdAt: string }>(
  items: T[]
): T[] {
  const priority = (n: T) => {
    if (!n.read && n.type === "alert") return 0;
    if (!n.read && n.type === "safety") return 1;
    if (!n.read) return 2;
    return 3;
  };
  return [...items].sort((a, b) => priority(a) - priority(b) || b.createdAt.localeCompare(a.createdAt));
}

export function AppHeader() {
  const unread = mockNotifications.filter((n) => !n.read).length;
  const sorted = sortNotificationsByPriority(mockNotifications);
  const [quietHours, setQuietHours] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cc_quiet_hours");
    if (stored === "1") setQuietHours(true);
  }, []);

  return (
    <div className="hidden md:flex flex-1 items-center gap-4 max-w-2xl mx-8">
      <CommunitySwitcher />
      <SearchLinkInput />

      <Dropdown
        trigger={
          <div className="relative rounded-xl p-2 hover:bg-[var(--muted)]">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--emergency)] text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </div>
        }
        align="end"
        className="shrink-0"
      >
        <div className="flex items-center justify-between px-4 py-2">
          <span className="font-medium text-sm">Notifications</span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
            <Sparkles className="h-3 w-3" /> AI sorted
          </span>
        </div>
        <div className="px-4 pb-2 text-xs text-[var(--muted-foreground)] border-b border-[var(--border)]">
          <span className="font-medium text-foreground">Daily digest</span> — 3 updates in your area
        </div>
        <DropdownSeparator />
        {sorted.slice(0, 4).map((n) => (
          <DropdownItem key={n.id} href={n.href}>
            <div className="flex flex-col gap-0.5 text-left">
              <span className="font-medium">{n.title}</span>
              <span className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                {n.body}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                <RelativeTime date={n.createdAt} />
              </span>
            </div>
          </DropdownItem>
        ))}
        <DropdownSeparator />
        <DropdownItem href="/alerts">View all notifications</DropdownItem>
        <DropdownItem href="/settings#notifications" icon={Moon}>
          Quiet hours {quietHours ? "on" : "off"} — settings
        </DropdownItem>
      </Dropdown>

      <Dropdown
        trigger={
          <div className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-[var(--muted)]">
            <Avatar initials={currentUser.avatar} verified={currentUser.verified} size="sm" />
            <span className="hidden lg:block text-sm font-medium">{currentUser.displayName}</span>
            <DropdownChevron />
          </div>
        }
        align="end"
      >
        <div className="px-4 py-3">
          <p className="font-medium">{currentUser.displayName}</p>
          <p className="text-xs text-[var(--muted-foreground)]">@{currentUser.username}</p>
          <Badge variant="accent" className="mt-2 capitalize">
            {currentUser.role.toLowerCase()}
          </Badge>
        </div>
        <DropdownSeparator />
        <DropdownItem href="/profile" icon={User}>
          Profile
        </DropdownItem>
        <DropdownItem href="/settings" icon={Settings}>
          Settings
        </DropdownItem>
        {currentUser.role === "ADMIN" && (
          <DropdownItem href="/admin" icon={Shield}>
            Admin Console
          </DropdownItem>
        )}
        <DropdownSeparator />
        <DropdownItem href="/api/auth/logout" icon={LogOut} destructive>
          Sign out
        </DropdownItem>
      </Dropdown>
    </div>
  );
}

export function MobileSearchBar() {
  return (
    <div className="md:hidden px-4 pb-3">
      <SearchLinkInput />
    </div>
  );
}
