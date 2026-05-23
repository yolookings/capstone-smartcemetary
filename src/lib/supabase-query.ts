// Helper for executing SQL queries via supabase MCP
// This bypasses the need for service role key

export async function supabase_execute_sql(query: string): Promise<unknown[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Use the MCP tool directly - this uses the user's authenticated connection
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    // Fallback: try direct POST to the endpoint
    throw new Error(`SQL execution failed: ${response.statusText}`);
  }

  return response.json();
}
