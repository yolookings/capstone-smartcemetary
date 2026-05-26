import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE env variables. Make sure .env.local exists.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function sync() {
  console.log("Fetching ADMIN users from profiles table...");
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id,email,role,full_name")
    .eq("role", "ADMIN");

  if (error) {
    console.error("Error fetching profiles from Supabase:", error.message);
    return;
  }

  console.log(`Found ${profiles.length} admin(s) in profiles table.`);

  for (const profile of profiles) {
    console.log(`Syncing auth metadata for: ${profile.email} (${profile.id})...`);
    
    const { data: userRecord, error: getError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (getError || !userRecord?.user) {
      console.error(`Failed to find Auth record for ${profile.email}:`, getError?.message || "User not found in auth.users");
      continue;
    }

    const currentMetadata = userRecord.user.user_metadata || {};
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { 
        user_metadata: { 
          ...currentMetadata,
          role: "ADMIN",
          full_name: profile.full_name || currentMetadata.full_name || "Super Admin"
        } 
      }
    );

    if (updateError) {
      console.error(`❌ Failed to update auth metadata for ${profile.email}:`, updateError.message);
    } else {
      console.log(`✅ Successfully updated auth metadata for ${profile.email}!`);
    }
  }
  
  console.log("Metadata synchronization complete.");
  process.exit(0);
}

sync();
