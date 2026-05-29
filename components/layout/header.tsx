"use client";

import Link from "next/link";
import { Bell, Search, Settings, User, LogOut, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownChevron,
} from "@/components/ui/dropdown";
import { mockNotifications, currentUser } from "@/lib/mock-data";
import { formatRelative } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function AppHeader() {
  const unread = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="hidden md:flex flex-1 items-center gap-4 max-w-2xl mx-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="What do you need today?"
          className="pl-10 bg-[var(--muted)] border-transparent focus:border-[var(--border)]"
        />
      </div>

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
        <div className="px-4 py-2 font-medium text-sm">Notifications</div>
        <DropdownSeparator />
        {mockNotifications.slice(0, 4).map((n) => (
          <DropdownItem key={n.id} href={n.href}>
            <div className="flex flex-col gap-0.5 text-left">
              <span className="font-medium">{n.title}</span>
              <span className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                {n.body}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {formatRelative(n.createdAt)}
              </span>
            </div>
          </DropdownItem>
        ))}
        <DropdownSeparator />
        <DropdownItem href="/alerts">View all notifications</DropdownItem>
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
    <div className="relative md:hidden px-4 pb-3">
      <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
      <Input
        placeholder="What do you need today?"
        className="pl-10 bg-[var(--muted)] border-transparent"
      />
    </div>
  );
}
