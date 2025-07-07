import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-sans-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "E-ticket - SMOCP",
  description: "ลงทะเบียนเพื่อเข้ากิจกรรม",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="icon" href="/SMOLOGO.webp" sizes="any" />
      <body className={`${ibmPlexSansThai.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
