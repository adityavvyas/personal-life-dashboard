import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const period1 = new Date();
    period1.setDate(period1.getDate() - 45); // Fetch last 45 days to ensure we have enough trading days (approx 30)
    const period2 = new Date(); // Current date

    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: '1d',
    });

    // Take the last 30 items (trading days) from quotes array
    const quotes = result.quotes || [];
    const history = quotes.slice(-30).map((quote, index, arr) => {
      // Find the previous close for change calculation (if it exists)
      // Since we sliced, if index === 0, we can look at the original quotes array
      const originalIndex = quotes.length - arr.length + index;
      const prevClose = originalIndex > 0 ? quotes[originalIndex - 1].close : quote.open;
      
      return {
        x: quote.date.getTime(), // Timestamp for luxon adapter
        o: quote.open,
        h: quote.high,
        l: quote.low,
        c: quote.close,
        v: quote.volume,
        prevClose: prevClose
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
