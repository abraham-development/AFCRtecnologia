import type { Metadata, Viewport } from 'next';
import { Fraunces, IBM_Plex_Mono, Inter } from 'next/font/google';
import localFont from 'next/font/local';

import './globals.css';

import CustomCursor from '@/components/effects/CustomCursor';
import Preloader from '@/components/effects/Preloader';
import ReadingProgress from '@/components/effects/ReadingProgress';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import SmoothScrollProvider from '@/components/layout/SmoothScrollProvider';
import { agency } from '@/content/agency';
import { allServices } from '@/content/services';

/* -------------------------------------------------------------------------- */
/*  Tipografia                                                                 */
/* -------------------------------------------------------------------------- */

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});

/**
 * Fraunces estatica (opsz 72, peso 300) para el titular de particulas del hero.
 * Canvas 2D no puede fijar ejes variables: con una instancia estatica el canvas
 * y el texto real dibujan exactamente la misma letra, con la «e» legible.
 * Instancia servida por Google Fonts (licencia OFL), subconjunto latin.
 */
const frauncesDisplay = localFont({
  src: '../fonts/fraunces-display-opsz72-300-latin.woff2',
  weight: '300',
  display: 'swap',
  variable: '--font-fraunces-display',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plex-mono',
  weight: ['300', '400', '500', '600'],
});

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                   */
/* -------------------------------------------------------------------------- */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://afcrtecnologia.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${agency.name} — Inteligencia artificial que trabaja`,
    template: `%s · ${agency.name}`,
  },
  description: agency.description,
  applicationName: agency.name,
  keywords: [
    'desarrollo de software Lima',
    'aplicaciones web y móviles',
    'diseño de páginas web',
    'integración SUNAT CPE',
    'SIRE SUNAT',
    'automatización con n8n',
    'chatbot de WhatsApp',
    'agentes de IA',
    'Hermes Agent',
    'IA on-premise',
    'capacitaciones en inteligencia artificial',
  ],
  authors: [{ name: agency.name, url: siteUrl }],
  creator: agency.name,
  publisher: agency.legalName,
  alternates: { canonical: '/' },
  category: 'technology',
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: siteUrl,
    siteName: agency.name,
    title: `${agency.name} — Inteligencia artificial que trabaja`,
    description: agency.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${agency.name} — Inteligencia artificial que trabaja`,
    description: agency.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export const viewport: Viewport = {
  themeColor: '#0D1828',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/* -------------------------------------------------------------------------- */
/*  Datos estructurados                                                        */
/* -------------------------------------------------------------------------- */

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: agency.name,
  legalName: agency.legalName,
  description: agency.longDescription,
  url: siteUrl,
  email: agency.email,
  foundingDate: agency.founded,
  areaServed: ['PE', 'LATAM', 'Global'],
  knowsLanguage: ['es', 'en'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: agency.address.street,
    addressLocality: agency.address.locality,
    addressRegion: agency.address.region,
    postalCode: agency.address.postalCode,
    addressCountry: agency.address.country,
  },
  sameAs: agency.socials.map((social) => social.href),
  serviceType: allServices.map((service) => service.title),
};

/* -------------------------------------------------------------------------- */
/*  Layout                                                                     */
/* -------------------------------------------------------------------------- */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${frauncesDisplay.variable} ${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-bg-primary text-text-primary antialiased">
        <script
          type="application/ld+json"
          // El JSON-LD es estatico y generado en el servidor.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <a
          href="#contenido"
          className="text-micro sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:bg-accent-cyan focus:px-4 focus:py-3 focus:text-bg-darkest"
        >
          Saltar al contenido
        </a>

        <Preloader />
        <CustomCursor />
        <ReadingProgress />

        <SmoothScrollProvider>
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
