// Basic Supabase Auth & Database Tester
// Run via: node tests/auth-test.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Anon Key in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("==========================================");
  console.log("🧪 Supabase Connection & Auth Tests");
  console.log("==========================================");

  // 1. Test Database Connectivity (market_cache should be publicly readable)
  console.log("\n[Test 1] Database Connectivity (Public Read)");
  try {
    const { data, error } = await supabase.from('market_cache').select('id').limit(1);
    if (error) throw error;
    console.log("✅ Database is reachable.");
  } catch (err) {
    console.error("❌ Database connection failed:");
    console.error(err.message);
  }

  // 2. Test Auth Service
  console.log("\n[Test 2] Auth Service Status");
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log("✅ Auth service is responding (No active session, which is normal for a server script).");
  } catch (err) {
    console.error("❌ Auth service failed:");
    console.error(err.message);
  }
  
  console.log("\n==========================================");
  console.log("All preliminary connection tests finished.");
  console.log("To fully test user workflows, please run 'npm run dev' and use the frontend interface.");
}

runTests();
