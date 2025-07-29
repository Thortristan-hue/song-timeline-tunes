# Audio MIME Type Configuration Examples

This file provides examples of how to configure proper MIME types for audio files on different server types.

## Vite Configuration (already implemented in vite.config.ts)
```typescript
// Ensure audio files are properly handled by Vite
assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg'],
```

## Apache (.htaccess)
```apache
# Add proper MIME types for audio files
AddType audio/mpeg .mp3
AddType audio/wav .wav
AddType audio/ogg .ogg
AddType audio/mp4 .m4a

# Optional: Enable compression for audio files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE audio/mpeg audio/wav audio/ogg
</IfModule>
```

## Nginx
```nginx
# In your nginx.conf or site configuration
location ~* \.(mp3|wav|ogg|m4a)$ {
    add_header Content-Type audio/mpeg;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Alternative approach in mime.types
http {
    include       /etc/nginx/mime.types;
    
    # Ensure these are in your mime.types or add here:
    # audio/mpeg    mp3;
    # audio/wav     wav;
    # audio/ogg     ogg;
}
```

## Node.js/Express
```javascript
// Set proper MIME types in Express
app.use('/sounds', express.static('public/sounds', {
    setHeaders: (res, path) => {
        if (path.endsWith('.mp3')) {
            res.setHeader('Content-Type', 'audio/mpeg');
        } else if (path.endsWith('.wav')) {
            res.setHeader('Content-Type', 'audio/wav');
        } else if (path.endsWith('.ogg')) {
            res.setHeader('Content-Type', 'audio/ogg');
        }
    }
}));
```

## CDN Configuration (Cloudflare, AWS CloudFront, etc.)
Most CDNs should automatically serve proper MIME types, but if not:

### Cloudflare
Use Page Rules or Transform Rules to set proper headers:
```
Header Name: Content-Type
Header Value: audio/mpeg
URL Pattern: *.mp3
```

### AWS S3/CloudFront
Set proper metadata when uploading files:
```bash
aws s3 cp file.mp3 s3://bucket/sounds/ --content-type audio/mpeg
```

## Vercel (vercel.json)
```json
{
  "headers": [
    {
      "source": "/sounds/(.*).mp3",
      "headers": [
        {
          "key": "Content-Type",
          "value": "audio/mpeg"
        }
      ]
    },
    {
      "source": "/sounds/(.*).wav",
      "headers": [
        {
          "key": "Content-Type", 
          "value": "audio/wav"
        }
      ]
    }
  ]
}
```

## Netlify (_headers file)
```
/sounds/*.mp3
  Content-Type: audio/mpeg
/sounds/*.wav
  Content-Type: audio/wav
/sounds/*.ogg
  Content-Type: audio/ogg
```