import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import * as cheerio from 'cheerio';

const yahooFinance = new YahooFinance();
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    // 1. Fetch Stocks (NSE / BSE / Global)
    const symbols = ['^NSEI', '^BSESN', 'RELIANCE.NS', 'TCS.NS'];
    const stocksPromises = symbols.map(symbol => 
      yahooFinance.quote(symbol).catch(() => null)
    );
    const stockResults = await Promise.all(stocksPromises);
    
    const stocks = stockResults.filter(Boolean).map(quote => ({
      symbol: quote.symbol,
      name: quote.shortName || quote.longName,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      currency: quote.currency
    }));

    // 2. Fetch Currencies (Frankfurter API - Free, No Key)
    let currencies = [];
    try {
      const curResponse = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR,EUR,GBP');
      if (curResponse.ok) {
        const curData = await curResponse.json();
        currencies = [
          { pair: 'USD/INR', rate: curData.rates.INR, change: 0 },
          { pair: 'EUR/INR', rate: (curData.rates.INR / curData.rates.EUR).toFixed(2), change: 0 },
          { pair: 'GBP/INR', rate: (curData.rates.INR / curData.rates.GBP).toFixed(2), change: 0 }
        ];
      }
    } catch (e) {
      console.error("Currency fetch failed", e);
    }

    // 3. Fetch Fuel Prices (Scraping GoodReturns for Jaipur)
    let fuel = {
      location: 'Jaipur',
      petrol: 104.88, // Fallback realistic values
      diesel: 90.36,
      e20: 109.88,    // Estimate: Petrol + ₹5
      xp95: 112.50    // Estimate: Premium High Octane
    };
    
    try {
      const fuelResponse = await fetch('https://www.goodreturns.in/petrol-price-in-jaipur.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (fuelResponse.ok) {
        const html = await fuelResponse.text();
        const $ = cheerio.load(html);
        
        // Find the strong tag containing the price (this is highly specific to the site structure, fallback ensures safety)
        const petrolText = $('.price-stat strong').first().text().replace(/[^\d.]/g, '');
        if (petrolText && !isNaN(parseFloat(petrolText))) {
          const petrolPrice = parseFloat(petrolText);
          fuel.petrol = petrolPrice;
          fuel.e20 = parseFloat((petrolPrice + 5).toFixed(2));
          fuel.xp95 = parseFloat((petrolPrice + 7.5).toFixed(2));
        }
      }
    } catch (e) {
      console.error("Fuel scrape failed", e);
    }

    return NextResponse.json({
      stocks,
      currencies,
      fuel,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Market API Error:", error);
    return NextResponse.json({ 
      error: 'Failed to fetch market data', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
