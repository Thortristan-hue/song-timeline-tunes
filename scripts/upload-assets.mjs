import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://vtymwospadqqbbgjqdqt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0eW13b3NwYWRxcWJiZ2pxZHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDgxNDYsImV4cCI6MjA2NTgyNDE0Nn0.ub6krtY2I_EeJMwTJtTIb6mjad88vDNTg8BFAqMouSQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function uploadAssets() {
  console.log('🎵 Starting audio assets upload to Supabase Storage...');

  // Path to the sounds directory
  const soundsDir = join(__dirname, '..', 'public', 'sounds');
  
  try {
    // Read all files from the sounds directory
    const files = readdirSync(soundsDir);
    console.log(`📁 Found ${files.length} files in sounds directory:`, files);

    // Create storage bucket if it doesn't exist (this will fail silently if it exists)
    const { error: bucketError } = await supabase.storage.createBucket('assets', {
      public: true
    });
    
    if (bucketError && bucketError.message !== 'Bucket already exists') {
      console.error('❌ Error creating bucket:', bucketError);
    } else {
      console.log('✅ Assets bucket ready');
    }

    // Upload each file
    for (const filename of files) {
      const filePath = join(soundsDir, filename);
      const fileBuffer = readFileSync(filePath);
      const fileExtension = extname(filename).toLowerCase();
      
      // Set correct content type for audio files
      let contentType = 'application/octet-stream';
      if (fileExtension === '.mp3') {
        contentType = 'audio/mpeg';
      } else if (fileExtension === '.wav') {
        contentType = 'audio/wav';
      } else if (fileExtension === '.ogg') {
        contentType = 'audio/ogg';
      }

      console.log(`⬆️ Uploading ${filename} with content-type: ${contentType}...`);

      const { data, error } = await supabase.storage
        .from('assets')
        .upload(`sounds/${filename}`, fileBuffer, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true // Replace if exists
        });

      if (error) {
        console.error(`❌ Failed to upload ${filename}:`, error);
      } else {
        console.log(`✅ Successfully uploaded ${filename}`);
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('assets')
          .getPublicUrl(`sounds/${filename}`);
        
        console.log(`🔗 Public URL: ${urlData.publicUrl}`);
      }
    }

    console.log('🎉 Audio assets upload completed!');
    
    // Test one file to verify it's accessible
    console.log('\n🧪 Testing file accessibility...');
    const testFile = files.find(f => f.endsWith('.mp3'));
    if (testFile) {
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(`sounds/${testFile}`);
      
      console.log(`🔍 Test URL: ${urlData.publicUrl}`);
      
      try {
        const response = await fetch(urlData.publicUrl);
        console.log(`📊 HTTP Status: ${response.status}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
        
        if (response.ok && response.headers.get('content-type')?.includes('audio')) {
          console.log('✅ Test file is accessible with correct content-type!');
        } else {
          console.log('⚠️ Test file may have issues with content-type');
        }
      } catch (fetchError) {
        console.error('❌ Error testing file accessibility:', fetchError);
      }
    }

  } catch (error) {
    console.error('❌ Error during upload process:', error);
    process.exit(1);
  }
}

// Run the upload
uploadAssets();