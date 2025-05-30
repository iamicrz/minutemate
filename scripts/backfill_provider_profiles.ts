import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configure these env vars in your .env.local or .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillProviderProfiles() {
  // 1. Find all users with role 'provider'
  const { data: providers, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'provider');
  if (userError) {
    console.error('Error fetching providers:', userError);
    return;
  }

  // 2. Find all existing professional_profiles user_ids
  const { data: profiles, error: profileError } = await supabase
    .from('professional_profiles')
    .select('user_id');
  if (profileError) {
    console.error('Error fetching professional_profiles:', profileError);
    return;
  }
  const existingProfileIds = new Set((profiles || []).map((p: any) => p.user_id));

  // 3. Insert missing professional_profiles
  let inserted = 0;
  for (const provider of providers || []) {
    if (!existingProfileIds.has(provider.id)) {
      const { error: insertError } = await supabase
        .from('professional_profiles')
        .insert([{ 
        user_id: provider.id,
        title: 'Provider',
        bio: '',
        credentials: '',
        experience: '',
        category: '',
        rate_per_15min: 0
      }]);
      if (insertError) {
        console.error(`Error creating profile for provider ${provider.id}:`, insertError);
      } else {
        console.log(`Created professional_profile for provider ${provider.id}`);
        inserted++;
      }
    }
  }
  console.log(`Backfill complete. ${inserted} new professional_profiles created.`);
}

backfillProviderProfiles().catch(console.error);
