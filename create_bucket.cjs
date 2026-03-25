const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://hyjpxscsixeoibzhtaf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5anB4c2NzaXhlb2liemhodGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc3MTk3MiwiZXhwIjoyMDg5MzQ3OTcyfQ.mTineL1IKkuKua2hIfrQo4TuCjNzcWC31rx1NEGyXtI"
);

async function main() {
  console.log("Creating bucket challenge-images...");
  
  // Try via SQL first (bypasses storage API RLS)
  const { data: sqlData, error: sqlErr } = await supabase.rpc("exec_sql", {
    query: `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
            VALUES ('challenge-images', 'challenge-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
            ON CONFLICT (id) DO NOTHING;`
  });
  
  if (!sqlErr) {
    console.log("SQL insert OK:", sqlData);
  } else {
    console.log("SQL method failed:", sqlErr.message);
    console.log("Trying storage API...");
    
    const { data, error } = await supabase.storage.createBucket("challenge-images", {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    
    if (error) {
      console.log("Storage API failed:", error.message);
      console.log("Trying direct REST...");
      
      // Try direct REST call
      const resp = await fetch("https://hyjpxscsixeoibzhtaf.supabase.co/storage/v1/bucket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5anB4c2NzaXhlb2liemhodGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc3MTk3MiwiZXhwIjoyMDg5MzQ3OTcyfQ.mTineL1IKkuKua2hIfrQo4TuCjNzcWC31rx1NEGyXtI",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5anB4c2NzaXhlb2liemhodGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc3MTk3MiwiZXhwIjoyMDg5MzQ3OTcyfQ.mTineL1IKkuKua2hIfrQo4TuCjNzcWC31rx1NEGyXtI"
        },
        body: JSON.stringify({
          id: "challenge-images",
          name: "challenge-images",
          public: true,
          file_size_limit: 5242880,
          allowed_mime_types: ["image/jpeg", "image/png", "image/webp"]
        })
      });
      const body = await resp.json();
      console.log("REST result:", resp.status, JSON.stringify(body));
    } else {
      console.log("Storage API OK:", data);
    }
  }
  
  // Verify
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log("All buckets:", buckets?.map(b => b.name));
}

main().catch(e => console.error("Fatal:", e.message));
