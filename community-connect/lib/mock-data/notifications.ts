export type NotificationType = "alert" | "event" | "message" | "community" | "system";

export interface MockNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  href?: string;
}

export const mockNotifications: MockNotification[] = [
  {
    id: "n1",
    type: "alert",
    title: "Emergency Alert",
    body: "Police activity near 4th & Main. Avoid the area.",
    read: false,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    href: "/alerts",
  },
  {
    id: "n2",
    type: "event",
    title: "Event Reminder",
    body: "Farmers Market starts in 2 days. You're marked as going.",
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    href: "/events",
  },
  {
    id: "n3",
    type: "message",
    title: "Sarah Martinez",
    body: "Thanks for helping with the cleanup!",
    read: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    href: "/messages",
  },
  {
    id: "n4",
    type: "community",
    title: "New comment on your post",
    body: "James Kim commented on your block party poll.",
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    href: "/feed",
  },
  {
    id: "n5",
    type: "system",
    title: "Profile verified",
    body: "Your neighbor verification badge has been approved.",
    read: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    href: "/profile",
  },
];
