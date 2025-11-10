import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize storage bucket on startup
const bucketName = 'make-2f7701f6-csv-files';
const { data: buckets } = await adminSupabase.storage.listBuckets();
const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
if (!bucketExists) {
  const { error } = await adminSupabase.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: 10485760, // 10MB limit
  });
  if (error) {
    console.error('Error creating storage bucket:', error);
  } else {
    console.log('Storage bucket created successfully');
  }
}

// Health check endpoint
app.get("/make-server-2f7701f6/health", (c) => {
  return c.json({ status: "ok" });
});

// Signup endpoint
app.post("/make-server-2f7701f6/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      success: true, 
      user: { 
        id: data.user.id, 
        email: data.user.email,
        name: data.user.user_metadata.name 
      } 
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Upload CSV endpoint
app.post("/make-server-2f7701f6/upload-csv", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('Authorization error while uploading CSV:', authError);
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    const body = await c.req.parseBody();
    const file = body['file'] as File;
    const fileName = body['fileName'] as string;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Generate unique file name
    const timestamp = Date.now();
    const uniqueFileName = `${user.id}/${timestamp}_${fileName || file.name}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from(bucketName)
      .upload(uniqueFileName, fileBuffer, {
        contentType: file.type || 'text/csv',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return c.json({ error: 'Failed to upload file' }, 500);
    }

    // Read file content for parsing
    const fileText = await file.text();

    // Store upload metadata in KV store
    const uploadId = `upload_${user.id}_${timestamp}`;
    const uploadMetadata = {
      id: uploadId,
      userId: user.id,
      fileName: fileName || file.name,
      storagePath: uniqueFileName,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
    };

    await kv.set(uploadId, uploadMetadata);

    // Also store in user's upload history
    const historyKey = `history_${user.id}`;
    const existingHistory = await kv.get(historyKey) || [];
    const updatedHistory = [uploadMetadata, ...existingHistory].slice(0, 20); // Keep last 20 uploads
    await kv.set(historyKey, updatedHistory);

    return c.json({ 
      success: true, 
      uploadId,
      fileName: fileName || file.name,
      fileContent: fileText,
      metadata: uploadMetadata
    });
  } catch (error) {
    console.error('Error during CSV upload:', error);
    return c.json({ error: 'Internal server error during file upload' }, 500);
  }
});

// Parse CSV endpoint
app.post("/make-server-2f7701f6/parse-csv", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('Authorization error while parsing CSV:', authError);
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    const { csvContent } = await c.req.json();

    if (!csvContent) {
      return c.json({ error: 'No CSV content provided' }, 400);
    }

    // Simple CSV parser (basic implementation)
    const lines = csvContent.trim().split('\n');
    if (lines.length === 0) {
      return c.json({ error: 'Empty CSV file' }, 400);
    }

    // Parse headers
    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));

    // Parse rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, any> = {};
      headers.forEach((header: string, index: number) => {
        const value = values[index] || '';
        // Try to convert to number if possible
        row[header] = isNaN(Number(value)) ? value : Number(value);
      });
      rows.push(row);
    }

    return c.json({ 
      success: true, 
      headers,
      data: rows,
      rowCount: rows.length
    });
  } catch (error) {
    console.error('Error during CSV parsing:', error);
    return c.json({ error: 'Internal server error during CSV parsing' }, 500);
  }
});

// Get upload history endpoint
app.get("/make-server-2f7701f6/upload-history", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('Authorization error while fetching upload history:', authError);
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    const historyKey = `history_${user.id}`;
    const history = await kv.get(historyKey) || [];

    return c.json({ 
      success: true, 
      history
    });
  } catch (error) {
    console.error('Error fetching upload history:', error);
    return c.json({ error: 'Internal server error while fetching history' }, 500);
  }
});

// Get specific upload file content
app.get("/make-server-2f7701f6/upload/:uploadId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized - No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('Authorization error while fetching upload:', authError);
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    const uploadId = c.req.param('uploadId');
    const uploadMetadata = await kv.get(uploadId);

    if (!uploadMetadata || uploadMetadata.userId !== user.id) {
      return c.json({ error: 'Upload not found or access denied' }, 404);
    }

    // Get signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
      .from(bucketName)
      .createSignedUrl(uploadMetadata.storagePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      return c.json({ error: 'Failed to retrieve file' }, 500);
    }

    // Download file content
    const response = await fetch(signedUrlData.signedUrl);
    const fileContent = await response.text();

    return c.json({ 
      success: true, 
      metadata: uploadMetadata,
      fileContent
    });
  } catch (error) {
    console.error('Error fetching upload:', error);
    return c.json({ error: 'Internal server error while fetching upload' }, 500);
  }
});

Deno.serve(app.fetch);
