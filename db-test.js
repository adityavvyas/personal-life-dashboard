const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/['"]/g, '').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('goals').select('*').limit(1);
  console.log(data);
  const { error: gErr } = await supabase.from('goals').insert([{ name: 'Test Goal', target_amount: 100, current_amount: 0 }]);
  console.log('Goals Insert Name, Target, Current Error:', gErr);
}

run();
