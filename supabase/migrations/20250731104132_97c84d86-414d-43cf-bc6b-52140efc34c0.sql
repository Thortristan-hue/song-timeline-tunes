-- Create storage bucket for audio assets
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);

-- Create policies for public access to audio files
CREATE POLICY "Public audio access" ON storage.objects
FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "Authenticated users can upload audio" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');