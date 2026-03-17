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
  title: "Solux Schools | School Management System",
  description: "A seamless, cloud-based school management system designed for modern educational institutions. Manage students, teachers, and schedules effortlessly.",
  keywords: ["Solux E Learning", "School Management System", "Moodle", "The ICT University", "ICT", "Education", "Solux"],
  authors:[{name: "Solux E Learning", url:"https://solux-elearning.com"},{name: "Novus Technologies"}],
  openGraph:{
    type: "website",
    locale: "en_US",
    url: "https://schools.solux-elearning.com",
    siteName: "Solux Schools",
    title: "Solux Schools | School Management System",
    description: "A seamless, cloud-based school management system designed for modern educational institutions. Manage students, teachers, and schedules effortlessly.",
    images: [
      {
        url: "https://solux-elearning.com/og-image.png", // Add an image in your public folder
        width: 1200,
        height: 630,
        alt: "Solux Schools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solux Schools | School Management System",
    description: "Modern educational management made easy.",
    images: ["https://solux-elearning.com/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Educational Organization",
    "name": "Solux Schools",
    "url": "https://schools.solux-elearning.com",
    "logo": "https://schools.solux-elearning.com",
    "description": "A seamless school management system for modern educational institutions.",
  }
  return (
        <ClerkProvider>
          <html lang="en" suppressHydrationWarning>
            <head>
              <ThemeScript />
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />²
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
