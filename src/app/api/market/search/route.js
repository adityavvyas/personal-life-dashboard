import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export const dynamic = 'force-dynamic';

// Use DuckDuckGo's Autocomplete API as a highly effective free spell-checker for companies/stocks
async function getSpellCorrection(query) {
  try {
    const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    // data = ["query", ["correction1", "correction2", ...]]
    if (data[1] && data[1].length > 0) {
      // Return the top suggestion
      return data[1][0];
    }
  } catch(e) { /* timeout or network error, silently fail */ }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    let results = await yahooFinance.search(query);
    let correctedQuery = null;

    // If no results found, use Wikipedia to spell-correct the query
    if ((!results.quotes || results.quotes.length === 0) && query.length > 2) {
      correctedQuery = await getSpellCorrection(query);
      if (correctedQuery) {
        results = await yahooFinance.search(correctedQuery);
      }
    }

    const validQuotes = results.quotes.filter(q => q.symbol);
    const indianQuotes = validQuotes.filter(q => q.exchange === 'NSI' || q.exchange === 'BSE' || q.symbol?.endsWith('.NS') || q.symbol?.endsWith('.BO'));
    
    // If no Indian quotes found, return the top generic ones
    const finalQuotes = indianQuotes.length > 0 ? indianQuotes : validQuotes;

    return NextResponse.json({ 
      quotes: finalQuotes.slice(0, 10),
      correctedQuery: correctedQuery // pass back to the UI so we can show "Did you mean..."
    });
  } catch (error) {
    console.error("Yahoo Finance Search Error: ", error);
    return NextResponse.json({ error: error.message || "Failed to fetch from Yahoo Finance" }, { status: 500 });
  }
}
