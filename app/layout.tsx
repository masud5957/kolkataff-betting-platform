import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KolkataFF — Play with clarity',
  description: 'A secure, transparent wallet experience for KolkataFF players.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5f7f4',
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-background"><body className="antialiased"><Script id="msg91-loader" strategy="afterInteractive">{`(function(){var urls=['https://verify.msg91.com/otp-provider.js','https://verify.phone91.com/otp-provider.js'];var i=0;function load(){var s=document.createElement('script');s.src=urls[i];s.async=true;s.onload=function(){window.dispatchEvent(new Event('msg91:loaded'))};s.onerror=function(){i++;if(i<urls.length)load()};document.head.appendChild(s)}load()})();`}</Script>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
