import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  try {
    // Yahoo finance quote accepts an array of strings
    const quotes = await yahooFinance.quote(symbols);
    
    // Ensure it returns an array even for a single symbol
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
    
    // Format the response for our frontend
    const formatted = quotesArray.map(q => ({
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChangePercent,
      changeAmount: q.regularMarketChange,
      currency: q.currency
    }));

    return NextResponse.json({ quotes: formatted });
  } catch (error) {
    console.error('Yahoo Finance API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
