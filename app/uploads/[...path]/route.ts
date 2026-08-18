import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const pathParts = resolvedParams.path;
  if (!pathParts || pathParts.length === 0) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const filename = pathParts[pathParts.length - 1];
  
  // Extract the suffix after the first timestamp hyphen.
  // e.g. "1782326325367-1731635832.Job-7.webp" -> suffix is "1731635832.Job-7.webp"
  const match = filename.match(/^\d+-(.+)$/);
  const suffix = match ? match[1] : filename;

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  try {
    const files = await fs.readdir(uploadsDir);
    
    // Find a file in public/uploads that matches the suffix
    const matchingFile = files.find(f => {
      const fMatch = f.match(/^\d+-(.+)$/);
      const fSuffix = fMatch ? fMatch[1] : f;
      return fSuffix === suffix;
    });

    if (matchingFile) {
      const filePath = path.join(uploadsDir, matchingFile);
      const fileBuffer = await fs.readFile(filePath);
      
      // Serve only known raster image types inline. An SVG here would render as
      // markup on this origin — stored XSS from an unauthenticated route — so it
      // is never given image/svg+xml; anything unrecognised is forced to
      // download as an opaque octet-stream rather than being sniffed and run.
      // nosniff stops the browser second-guessing the type we set.
      let contentType: string | null = null;
      if (matchingFile.endsWith('.png')) contentType = 'image/png';
      else if (matchingFile.endsWith('.jpg') || matchingFile.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (matchingFile.endsWith('.webp')) contentType = 'image/webp';
      else if (matchingFile.endsWith('.gif')) contentType = 'image/gif';
      else if (matchingFile.endsWith('.avif')) contentType = 'image/avif';

      const headers: Record<string, string> = {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      };
      if (contentType) {
        headers['Content-Type'] = contentType;
      } else {
        headers['Content-Type'] = 'application/octet-stream';
        headers['Content-Disposition'] = 'attachment';
      }

      return new NextResponse(fileBuffer, { headers });
    }
  } catch (error) {
    console.error('Error in uploads fallback route:', error);
  }

  return new NextResponse('Not Found', { status: 404 });
}
