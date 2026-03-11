import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SettingsProvider } from "@/context/SettingsContext";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { ThemeScript } from "@/components/ThemeScript";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solux | School Management System",
  description: "A seamless school management system for the needs of the modern educational institutions. Powered by Novus Technologies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <ClerkProvider>
          <html lang="en" suppressHydrationWarning>
            <head>
              <ThemeScript />
            </head>
            <body className={inter.className}>
              <ThemeInitializer />
              <SettingsProvider>
                {children}
                <ToastContainer position="bottom-right" theme="dark" />
              </SettingsProvider>
            </body>
          </html>
        </ClerkProvider>

  );
}
