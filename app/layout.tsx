import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { ThemeProvider } from '@/components/ThemeProvider';
import DarkMode3DTransition from '@/components/DarkMode3DTransition';

export const metadata: Metadata = {
  title: 'Calculadora de Nitrogênio para Milho',
  description: 'Calculadora agronômica de adubação nitrogenada e estimativa de produtividade de milho por estande, grãos, PMG e quebra com tema escuro e visualizador 3D.',
  openGraph: {
    title: 'Calculadora de Nitrogênio para Milho',
    description: 'Calculadora agronômica de adubação nitrogenada e estimativa de produtividade de milho por estande, grãos, PMG e quebra com tema escuro e visualizador 3D.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora de Nitrogênio para Milho',
    description: 'Calculadora agronômica de adubação nitrogenada e estimativa de produtividade de milho por estande, grãos, PMG e quebra com tema escuro e visualizador 3D.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('agronomica_theme');
                var d = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (t === 'dark' || (!t && d)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased transition-colors duration-300">
        <ThemeProvider>
          <DarkMode3DTransition />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
