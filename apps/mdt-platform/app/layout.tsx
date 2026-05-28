import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { DemoProvider } from "@/lib/demo-store";
import { LiveBanner } from "@/components/shared/LiveBanner";
import { ThemeShell } from "@/components/shared/ThemeShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlueCore MDT — Emergency Communications Platform",
  description: "Law enforcement MDT, dispatch console, and 911 call intake platform",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "BlueCore MDT" },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeShell>
          <AuthProvider>
            <DemoProvider>
              <LiveBanner />
              {children}
            </DemoProvider>
          </AuthProvider>
        </ThemeShell>
      </body>
    </html>
  );
}
