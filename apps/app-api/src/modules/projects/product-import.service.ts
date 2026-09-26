import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImportOutcome, ProductField } from 'src/graphql/generated/graphql';

export interface ImportedProductData {
  title: string | null;
  category: string | null;
  pricePhp: number | null;
  description: string | null;
}

export interface ProductImportAttempt {
  outcome: ImportOutcome;
  host: string;
  data: ImportedProductData;
}

/** The fields an import can fill (features are never in public metadata). */
export const IMPORTABLE_FIELDS: ProductField[] = [
  ProductField.TITLE,
  ProductField.CATEGORY,
  ProductField.PRICE,
  ProductField.DESCRIPTION,
  ProductField.FEATURES,
];

const TIMEOUT_MS = 8_000;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

const EMPTY: ImportedProductData = {
  title: null,
  category: null,
  pricePhp: null,
  description: null,
};

/**
 * Reads public product metadata (Open Graph and JSON-LD `Product`) from an
 * allowlisted host. It never sends cookies or credentials, re-checks the host
 * on every redirect, stops after 8 seconds or 2 MB, and never throws for a
 * fetch problem: import is a convenience and must not block manual entry.
 */
@Injectable()
export class ProductImportService {
  private readonly logger = new Logger(ProductImportService.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchProduct(rawUrl: string): Promise<ProductImportAttempt> {
    const url = parseHttpsUrl(rawUrl);
    const host = url?.hostname ?? '';

    if (!url || !this.isAllowed(url.hostname)) {
      return { outcome: ImportOutcome.NOT_ALLOWED, host, data: EMPTY };
    }

    try {
      const html = await this.fetchHtml(url);
      const data = extractProductData(html);
      const found = Object.values(data).some((value) => value !== null);

      return {
        outcome: found ? ImportOutcome.PARTIAL : ImportOutcome.FAILED,
        host,
        data,
      };
    } catch (error) {
      this.logger.warn(
        `Product import from ${host} failed: ${(error as Error).message}`,
      );

      return { outcome: ImportOutcome.FAILED, host, data: EMPTY };
    }
  }

  private isAllowed(hostname: string): boolean {
    const allowed =
      this.configService.get<string[]>('PRODUCT_IMPORT_ALLOWED_HOSTS') ?? [];
    const host = hostname.toLowerCase();

    return allowed.some(
      (candidate) => host === candidate || host.endsWith(`.${candidate}`),
    );
  }

  private async fetchHtml(initialUrl: URL): Promise<string> {
    let url = initialUrl;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const response = await fetch(url, {
        redirect: 'manual',
        credentials: 'omit',
        headers: { Accept: 'text/html' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (response.status >= 300 && response.status < 400) {
        const next = parseHttpsUrl(
          new URL(response.headers.get('location') ?? '', url).toString(),
        );

        if (!next || !this.isAllowed(next.hostname)) {
          throw new Error('Redirected to a host that is not allowed.');
        }

        url = next;
        continue;
      }

      if (!response.ok || !response.body) {
        throw new Error(`Unexpected status ${response.status}.`);
      }

      return readCapped(response.body);
    }

    throw new Error('Too many redirects.');
  }
}

function parseHttpsUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());

    return url.protocol === 'https:' && !url.username && !url.password
      ? url
      : null;
  } catch {
    return null;
  }
}

async function readCapped(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();

    if (done) break;

    received += value.byteLength;

    if (received > MAX_BYTES) {
      await reader.cancel();
      break;
    }

    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

/** Exported for tests. Reads only public metadata; never page copy. */
export function extractProductData(html: string): ImportedProductData {
  const meta = (property: string) => {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
      'i',
    );
    const match = html.match(pattern);

    return decodeEntities(match?.[1] ?? match?.[2] ?? '').trim() || null;
  };

  const jsonLd = findJsonLdProduct(html);
  const offers = Array.isArray(jsonLd?.offers)
    ? jsonLd?.offers[0]
    : jsonLd?.offers;
  const currency =
    readString(offers?.priceCurrency) ?? meta('product:price:currency');
  const rawPrice = readString(offers?.price) ?? meta('product:price:amount');
  const price =
    rawPrice !== null ? Number(rawPrice.replace(/[^0-9.]/g, '')) : NaN;

  return {
    title: clip(readString(jsonLd?.name) ?? meta('og:title'), 120),
    category: clip(readString(jsonLd?.category), 80),
    pricePhp:
      Number.isFinite(price) &&
      price >= 0 &&
      (currency ?? 'PHP').toUpperCase() === 'PHP'
        ? price
        : null,
    description: clip(
      readString(jsonLd?.description) ?? meta('og:description'),
      2000,
    ),
  };
}

type JsonLdProduct = {
  name?: unknown;
  category?: unknown;
  description?: unknown;
  offers?:
    | { price?: unknown; priceCurrency?: unknown }
    | Array<{
        price?: unknown;
        priceCurrency?: unknown;
      }>;
};

function findJsonLdProduct(html: string): JsonLdProduct | null {
  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const [, content] of scripts) {
    try {
      const parsed: unknown = JSON.parse(content);
      const nodes = Array.isArray(parsed)
        ? parsed
        : [parsed, ...(readGraph(parsed) ?? [])];

      for (const node of nodes) {
        if (
          node &&
          typeof node === 'object' &&
          (node as { '@type'?: unknown })['@type'] === 'Product'
        ) {
          return node as JsonLdProduct;
        }
      }
    } catch {
      // Malformed structured data is ignored; the form still works.
    }
  }

  return null;
}

function readGraph(value: unknown): unknown[] | null {
  if (value && typeof value === 'object' && '@graph' in value) {
    const graph = (value as { '@graph'?: unknown })['@graph'];
    return Array.isArray(graph) ? graph : null;
  }

  return null;
}

function readString(value: unknown): string | null {
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return null;

  return decodeEntities(value).trim() || null;
}

function clip(value: string | null, max: number): string | null {
  return value ? value.slice(0, max) : null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
