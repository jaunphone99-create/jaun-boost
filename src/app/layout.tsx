import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JAUN BOOST — ระบบสวัสดิการอาหาร",
  description: "ระบบเบิก-เติมอาหารแบบบริการตนเอง เน้นความซื่อสัตย์ ไม่ต้องมีคนเฝ้า",
  keywords: ["jaun boost", "ระบบอาหาร", "เกียรติศักดิ์", "สวัสดิการ", "welfare"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#003366",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Prompt:wght@300;400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
