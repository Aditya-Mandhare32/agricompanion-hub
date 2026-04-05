UPDATE storage.buckets 
SET file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/mov', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg']
WHERE name = 'community-images';