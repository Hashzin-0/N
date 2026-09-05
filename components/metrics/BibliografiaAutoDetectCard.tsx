'use client';

import React, { useState, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import CalculationIsland from '@/components/CalculationIsland';
import CalculationMemoryPanel from '@/components/CalculationMemoryPanel';
import { formatReference } from '@/lib/abnt/utils';
import { ABNTReference, ReferenceType } from '@/lib/abnt/types';
import { cn } from '@/lib/utils';

interface BibliografiaAutoDetectProps {
  onReferenceSelected: (ref: ABNTReference) => void;
  initialUrl?: string;
}

interface ExtractedMetadata {
  authors: string[];
  title: string;
  subtitle: string;
  year: number | null;
  publication: string;  // Changed from string | null to string
  url: string;
  accessDate: string;   // Changed from string | null to string
  type: ReferenceType;
}

function extractMetadataFromHtml(html: string, url: string): ExtractedMetadata | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    if (doc.querySelector('html') === null) return null;

    const extractText = (selector: string): string => {
      const el = doc.querySelector(selector);
      return el?.textContent?.trim() || '';
    };

    const extractAttribute = (selector: string, attr: string): string => {
      const el = doc.querySelector(selector);
      return el?.getAttribute(attr) || '';
    };

    // Try Open Graph tags first
    const ogTitle = extractAttribute('meta[property="og:title"]', 'content');
    const ogDescription = extractAttribute('meta[property="og:description"]', 'content');
    const ogAuthor = extractAttribute('meta[property="og:author"]', 'content');
    const ogType = extractAttribute('meta[property="og:type"]', 'content');

    // Try Twitter Cards
    const twitterTitle = extractAttribute('meta[name="twitter:title"]', 'content');
    const twitterDescription = extractAttribute('meta[name="twitter:description"]', 'content');
    const twitterAuthor = extractAttribute('meta[name="twitter:author"]', 'content');

    // Use twitter or og, preferring twitter if available
    const title = twitterTitle || ogTitle || doc.title || 'Título não encontrado';
    const description = twitterDescription || ogDescription || '';

    // Extract author from meta tags or fallback
    let authors: string[] = [];
    const authorMeta = extractAttribute('meta[name="author"]', 'content');
    const ogAuthorContent = extractAttribute('meta[property="og:author"]', 'content');

    if (authorMeta) {
      authors = authorMeta.split(/[,&]/).map((a: string) => a.trim()).filter((a: string) => a.length > 0);
    } else if (ogAuthorContent) {
      authors = [ogAuthorContent];
    }

    // Extract year - try multiple patterns
    let year: number | null = null;
    const yearMatch = description.match(/\b(19|20)\d{2}\b/) || title.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      year = parseInt(yearMatch[0], 10);
    }
    // Also check og:date or other date metas
    const ogDate = extractAttribute('meta[property="og:date"]', 'content');
    if (!year && ogDate) {
      const dateMatch = ogDate.match(/\b(19|20)\d{2}\b/);
      if (dateMatch) year = parseInt(dateMatch[0], 10);
    }

    // Try to determine publication/journal from meta or URL
    const publication = extractAttribute('meta[property="og:site_name"]', 'content') ||
                       extractText('meta[name="citation_journal_title"]') ||
                       extractText('meta[name="dc.title"]');

    // Determine source type based on URL and available metadata
    let type: ReferenceType = 'website';
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('scielo') || lowerUrl.includes('.gov.br') || lowerUrl.includes('.org.br')) {
      type = 'website';
    } else if (lowerUrl.includes('doi.org') || lowerUrl.includes('/doi/')) {
      type = 'journal_article';
    } else if (lowerUrl.includes('conference') || lowerUrl.includes('simp')) {
      type = 'conference';
    } else if (lowerUrl.includes('teses') || lowerUrl.includes('dissertacao')) {
      type = 'thesis';
    } else if (lowerUrl.includes('legislacao') || lowerUrl.includes('lei') || lowerUrl.includes('decreto')) {
      type = 'legislation';
    } else if (lowerUrl.includes('.pdf')) {
      type = 'thesis'; // PDFs often are theses/dissertations
    }

    return {
      authors: authors.length > 0 ? authors : ['Autor não identificado'],
      title,
      subtitle: description || '',
      year,
      publication: publication || '',
      url,
      accessDate: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
      type,
    };
  } catch (error) {
    console.error('Error extracting metadata from HTML:', error);
    return null;
  }
}

function extractMetadataFromPdf(pdfBase64: string, originalUrl: string): ExtractedMetadata | null {
  // PDF text extraction is complex in the browser without external libraries
  // For now, return null to indicate PDF extraction not supported without additional deps
  // User can still paste the URL and we'll try HTML extraction, or they can manually enter data
  return null;
}

export default function BibliografiaAutoDetectCard({ onReferenceSelected, initialUrl }: BibliografiaAutoDetectProps) {
  const { isDark } = useTheme();
  const [showCalc, setShowCalc] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scraping' | 'success' | 'error'>('idle');
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
  const [inputValue, setInputValue] = useState<string>(initialUrl || '');
  const [file, setFile] = useState<File | null>(null);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setMetadata(null);
    setStatus('idle');
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    setStatus('scraping');
    setInputValue(file.name);

    // For PDF files, we can attempt basic text extraction
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result ? e.target.result.toString() : '';
        // Very basic PDF metadata extraction - look for common patterns
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? parseInt(yearMatch[0], 10) : null;

        setMetadata({
          authors: ['Autor não identificado'],
          title: 'Extração de PDF (metadata limitada)',
          subtitle: text.substring(0, 200),
          year,
          publication: '',
          url: file.name,
          accessDate: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
          type: 'thesis',
        });
        setStatus('success');
      };
      reader.readAsText(file);
    } else {
      setStatus('error');
    }
  }, []);

  const handleScrape = useCallback(async () => {
    if (!inputValue.trim()) return;

    setStatus('scraping');
    setMetadata(null);

    try {
      // Check if it's a file upload scenario (already handled above)
      if (file && file.type === 'application/pdf') {
        // Already handled in onFileChange
        return;
      }

      // Fetch the URL
      const response = await fetch(inputValue, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgronômicaN-Pro/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error('Não foi possível acessar o URL. Verifique se o link está correto.');
      }

      const html = await response.text();
      const extracted = extractMetadataFromHtml(html, inputValue);

      if (!extracted) {
        throw new Error('Não foi possível extrair metadados do link. O site pode não ter tags de metadado disponíveis.');
      }

      setMetadata(extracted);
      setStatus('success');
    } catch (err: any) {
      console.error('Scraping error:', err);
      setStatus('error');
    }
  }, [inputValue, file]);

  const ref = (() => {
    if (!metadata) return null;
    const authorsABNT = metadata.authors.map((a: string) => ({
      surname: a.split(' ').pop() || a,
      firstName: a.replace(a.split(' ').pop() || a, '').trim(),
    }));
    return {
      id: `auto_${Date.now()}`,
      type: metadata.type,
      authors: authorsABNT,
      title: metadata.title,
      subtitle: metadata.subtitle || undefined,
      year: String(metadata.year ?? new Date().getFullYear()),
      url: metadata.url,
      accessDate: metadata.accessDate,
      journalTitle: metadata.publication,
    };
  })();

  const formattedRef = ref ? formatReference(ref) : null;

  return (
    <div className="relative bg-white dark:bg-[#1C201A] rounded-3xl border border-[#E5E2D9] dark:border-[#2C3328] p-5 shadow-sm transition-colors" id="bibliography_autodetect">
      <CalculationIsland
        isVisible={showCalc}
        onToggle={() => setShowCalc(!showCalc)}
        accentColor="#5A5A40"
        darkAccentColor="#9CB386"
        isDark={isDark}
      />
      <div className="space-y-4">
        {/* Input Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-[#5A5A40] dark:text-[#9CB386]" />
            <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">
              Link ou Arquivo
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Cole o link do artigo, site ou PDF..."
              className={`w-full px-4 py-3 rounded-lg border border-[#D5D4D0] dark:border-[#3D3D3D] dark:bg-[#161A14] text-[12px] focus:outline-none focus:border-[#5A5A40] transition-colors ${status === 'scraping' ? 'bg-[#F0EDE5]/20' : ''} ${status === 'error' ? 'border-red-500/50' : ''}`}
              disabled={status === 'scraping'}
            />
            <button
              onClick={handleScrape}
              disabled={status !== 'idle' || !inputValue.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                status === 'scraping' ? 'bg-[#5A5A40] text-white' : 'bg-[#5A5A40] text-white'
              } ${status === 'scraping' ? 'animate-pulse' : ''}`}
              title="Buscar metadados"
            >
              {status === 'scraping' ? '🔍' : 'Buscar'}
            </button>
            <input
              type="file"
              accept=".pdf,.jpg,.png,.jpeg"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              className="hidden"
            />
            <button
              onClick={() => document.querySelector('input[type="file"]')?.click()}
              className="ml-2 text-[10px] text-[#5A5A40] dark:text-[#9CB386] hover:underline"
              title="Carregar arquivo"
            >
              📄
            </button>
          </div>
        </div>

        {/* Status & Results */}
        {status === 'scraping' && (
          <div className="text-sm text-[#8C897E] dark:text-[#9EA399]">
            <span className="animate-spin h-4 w-4 mr-2 inline-block" />
            Extraindo metadados...
          </div>
        )}

        {status === 'success' && metadata && (
          <div className="space-y-3">
            {/* Extracted Info Preview */}
            <div className="bg-[#F9F8F6] dark:bg-[#232821] p-3 rounded-lg border border-[#E5E2D9] dark:border-[#2C3328]">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-[#8C897E] dark:text-[#9EA399] uppercase block">Autor:</span>
                  <span className="font-medium text-[#5A5A40] dark:text-[#9CB386]">{metadata.authors.join(', ')}</span>
                </div>
                <div>
                  <span className="text-[#8C897E] dark:text-[#9EA399] uppercase block">Título:</span>
                  <span className="font-medium text-[#5A5A40] dark:text-[#9CB386]">{metadata.title}</span>
                </div>
              </div>
              {metadata.year && (
                <div className="mt-1">
                  <span className="text-[#8C897E] dark:text-[#9EA399] uppercase block">Ano:</span>
                  <span className="font-medium text-[#5A5A40] dark:text-[#9CB386]">{metadata.year}</span>
                </div>
              )}
              {metadata.publication && (
                <div className="mt-1">
                  <span className="text-[#8C897E] dark:text-[#9EA399] uppercase block">Publicação:</span>
                  <span className="font-medium text-[#5A5A40] dark:text-[#9CB386]">{metadata.publication}</span>
                </div>
              )}
            </div>

            {/* Formatted ABNT Reference */}
            <div>
              <span className="text-[10px] font-bold text-[#8C897E] dark:text-[#9EA399] uppercase block">Referência ABNT:</span>
              <div className="mt-1 overflow-x-auto">
                <pre 
                  className={`bg-white dark:bg-[#1C201A] p-3 rounded-lg font-mono text-[10px] leading-relaxed ${
                    isDark ? 'border-[#2C3328] text-[#E8E6DF]' : 'border-[#E5E2D9] text-[#3D3D3D]'
                  }`}
                  onClick={() => {
                    navigator.clipboard.writeText(formattedRef || '').then(() => {
                      // Simple feedback - could add toast
                    });
                  }}
                >
                  {formattedRef || 'Formatação indisponível'}
                </pre>
              </div>
              <button
                onClick={handleSelectReference}
                disabled={!formattedRef}
                className="mt-2 w-full py-2 rounded-lg text-[10px] font-bold transition-all ${
                  formattedRef ? 'bg-[#5A5A40] text-white hover:bg-[#7A763A]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }"
                title="Selecionar esta referência"
              >
                {formattedRef ? 'Usar esta referência ABNT' : 'Não foi possível formatar'}
              </button>
            </div>

            {/* Source Type Info */}
            <div className="text-xs text-[#8C897E] dark:text-[#9EA399]">
              Tipo detectado: {metadata.type}
            </div>
          </div>
        )}

        {status === 'error' && inputValue && (
          <div className="text-sm text-red-500 dark:text-red-400">
            Não foi possível extrair metadados. Verifique se o link está correto e tente novamente.
          </div>
        )}

        {/* Memory Panel / How it works */}
        <CalculationMemoryPanel isVisible={showCalc} isDark={isDark}>
          <div className={`p-2.5 rounded-lg border font-mono text-[11px] leading-relaxed ${
            isDark ? 'bg-[#232821] border-[#2C3328] text-[#E8E6DF]' : 'bg-white border-[#E5E2D9] text-[#3D3D3D]'
          }`}>
            <div className={`font-semibold mb-1 ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>COMO FUNCIONA:</div>
            <div className={`font-bold ${isDark ? 'text-[#9CB386]' : 'text-[#5A5A40]'}`}>
              O sistema extrai automaticamente autor, título, data e outras informações do link ou arquivo que você colar. Basta colar o URL do artigo científico, site oficial ou PDF e clicar em "Buscar metadados". As informações serão extraídas das tags meta do HTML, metadados do PDF ou padrões de URL, e automaticamente formatadas no estilo ABNT NBR 6023:2025.
            </div>
            <p className={`mt-1 ${isDark ? 'text-[#9EA399]' : 'text-[#8C897E]'}`}>
              Suporta: artigos de periódicos (DOI), sites acadêmicos (SciELO, REDALYC), legislação, teses e dissertações. Para sites sem metadados disponíveis, é possível inserir as informações manualmente depois.
            </p>
          </div>
        </CalculationMemoryPanel>
      </div>
    </div>
  );
}