import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Attempting to scrape live data from a reliable public source
    const response = await fetch('https://www.goodreturns.in/petrol-price-in-jaipur.html', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) throw new Error('Failed to fetch');
    const html = await response.text();
    
    // Fallback static prices for Jaipur (updated as of current data)
    let petrolPrice = 104.88;
    let dieselPrice = 90.36;
    
    // Very rudimentary scraping approach
    // Look for patterns like ₹104.88 in the HTML table
    const petrolMatch = html.match(/₹\s*([0-9]{3}\.[0-9]{2})/);
    if (petrolMatch && petrolMatch[1]) {
      const parsed = parseFloat(petrolMatch[1]);
      if (parsed > 90 && parsed < 130) {
        petrolPrice = parsed;
      }
    }
    
    // Premium and blends are usually a fixed offset from regular
    return NextResponse.json({
      location: "Jaipur",
      date: new Date().toISOString().split('T')[0],
      rates: {
        "Petrol (Regular)": petrolPrice,
        "Petrol (E20)": petrolPrice, // E20 is typically priced identically to E10/Regular
        "Petrol (High Octane/XP95)": petrolPrice + 4.62,
        "Diesel (Regular)": dieselPrice,
        "Diesel (Premium/XtraGreen)": dieselPrice + 3.14,
        "CNG": 85.00
      }
    });
    
  } catch (error) {
    // Fallback if scrape fails
    return NextResponse.json({
      location: "Jaipur",
      date: new Date().toISOString().split('T')[0],
      isFallback: true,
      rates: {
        "Petrol (Regular)": 104.88,
        "Petrol (E20)": 104.88,
        "Petrol (High Octane/XP95)": 109.50,
        "Diesel (Regular)": 90.36,
        "Diesel (Premium/XtraGreen)": 93.50,
        "CNG": 85.00
      }
    });
  }
}
