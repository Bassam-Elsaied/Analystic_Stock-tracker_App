"use server";

import { cache } from "react";
import { POPULAR_STOCK_SYMBOLS } from "../data";
import { getDateRange, validateArticle, formatArticle } from "../utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

type FinnhubProfile = {
  name?: string;
  ticker?: string;
  exchange?: string;
};

type FinnhubSearchResultWithExchange = FinnhubSearchResult & {
  __exchange?: string;
};

/**
 * Helper function to fetch JSON from Finnhub API with optional caching
 */
const fetchJSON = async <T>(
  url: string,
  revalidateSeconds?: number
): Promise<T> => {
  const options: RequestInit = revalidateSeconds
    ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
    : { cache: "no-store" };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Finnhub API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

/**
 * Get news articles based on watchlist symbols or general market news
 * @param symbols - Optional array of stock symbols to fetch news for
 * @returns Array of formatted news articles (max 6)
 */
export const getNews = async (
  symbols?: string[]
): Promise<MarketNewsArticle[]> => {
  try {
    const { from, to } = getDateRange(5);

    // If symbols exist, fetch company-specific news
    if (symbols && symbols.length > 0) {
      const cleanedSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0);

      if (cleanedSymbols.length === 0) {
        return fetchGeneralNews(from, to);
      }

      return await fetchSymbolBasedNews(cleanedSymbols, from, to);
    }

    // Otherwise, fetch general market news
    return fetchGeneralNews(from, to);
  } catch (error) {
    console.error("Error fetching news:", error);
    throw new Error("Failed to fetch news");
  }
};

/**
 * Fetch news for specific symbols using round-robin approach
 */
const fetchSymbolBasedNews = async (
  symbols: string[],
  from: string,
  to: string
): Promise<MarketNewsArticle[]> => {
  const allArticles: MarketNewsArticle[] = [];
  const maxRounds = 6;

  // Round-robin through symbols to collect articles
  for (let round = 0; round < maxRounds && allArticles.length < 6; round++) {
    for (let i = 0; i < symbols.length && allArticles.length < 6; i++) {
      const symbol = symbols[i];

      try {
        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
        const articles = await fetchJSON<RawNewsArticle[]>(url);

        // Filter valid articles
        const validArticles = articles.filter(validateArticle);

        // Take one article from this symbol in this round
        if (validArticles.length > round) {
          const article = validArticles[round];
          const formattedArticle = formatArticle(
            article,
            true,
            symbol,
            allArticles.length
          );
          allArticles.push(formattedArticle);
        }
      } catch (error) {
        console.error(`Error fetching news for symbol ${symbol}:`, error);
        // Continue to next symbol
      }
    }
  }

  // If we didn't get enough articles from symbols, fallback to general news
  if (allArticles.length === 0) {
    return fetchGeneralNews(from, to);
  }

  // Sort by datetime descending
  allArticles.sort((a, b) => b.datetime - a.datetime);

  return allArticles;
};

/**
 * Fetch general market news
 */
const fetchGeneralNews = async (
  _from: string,
  _to: string
): Promise<MarketNewsArticle[]> => {
  try {
    const url = `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
    const articles = await fetchJSON<RawNewsArticle[]>(url);

    // Validate articles
    const validArticles = articles.filter(validateArticle);

    // Deduplicate by id, url, and headline
    const seen = new Set<string>();
    const uniqueArticles = validArticles.filter((article) => {
      const key = `${article.id}-${article.url}-${article.headline}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Take top 6 and format them
    const topArticles = uniqueArticles.slice(0, 6);
    return topArticles.map((article, index) =>
      formatArticle(article, false, undefined, index)
    );
  } catch (error) {
    console.error("Error fetching general market news:", error);
    throw error;
  }
};

export const searchStocks = cache(
  async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
      const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
      if (!token) {
        // If no token, log and return empty to avoid throwing per requirements
        console.error(
          "Error in stock search:",
          new Error("FINNHUB API key is not configured")
        );
        return [];
      }

      const trimmed = typeof query === "string" ? query.trim() : "";

      let results: FinnhubSearchResult[] = [];

      if (!trimmed) {
        // Fetch top 10 popular symbols' profiles
        const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
        const profiles = await Promise.all(
          top.map(async (sym) => {
            try {
              const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(
                sym
              )}&token=${token}`;
              // Revalidate every hour
              const profile = await fetchJSON<FinnhubProfile>(url, 3600);
              return { sym, profile };
            } catch (e) {
              console.error("Error fetching profile2 for", sym, e);
              return { sym, profile: null };
            }
          })
        );

        results = profiles
          .map(({ sym, profile }) => {
            const symbol = sym.toUpperCase();
            const name: string | undefined =
              profile?.name || profile?.ticker || undefined;
            const exchange: string | undefined = profile?.exchange || undefined;
            if (!name) return undefined;
            const r: FinnhubSearchResultWithExchange = {
              symbol,
              description: name,
              displaySymbol: symbol,
              type: "Common Stock",
              __exchange: exchange,
            };
            return r;
          })
          .filter((x): x is FinnhubSearchResultWithExchange => Boolean(x));
      } else {
        const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(
          trimmed
        )}&token=${token}`;
        const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
        results = Array.isArray(data?.result) ? data.result : [];
      }

      const mapped: StockWithWatchlistStatus[] = results
        .map((r) => {
          const upper = (r.symbol || "").toUpperCase();
          const name = r.description || upper;
          const exchangeFromDisplay =
            (r.displaySymbol as string | undefined) || undefined;
          const exchangeFromProfile = (r as FinnhubSearchResultWithExchange)
            .__exchange;
          const exchange = exchangeFromDisplay || exchangeFromProfile || "US";
          const type = r.type || "Stock";
          const item: StockWithWatchlistStatus = {
            symbol: upper,
            name,
            exchange,
            type,
            isInWatchlist: false,
          };
          return item;
        })
        .slice(0, 15);

      return mapped;
    } catch (err) {
      console.error("Error in stock search:", err);
      return [];
    }
  }
);
