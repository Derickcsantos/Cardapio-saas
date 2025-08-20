import sharp from 'sharp';

export async function convertToWebP(file) {
  try {
    // Read file as buffer
    const buffer = await file.arrayBuffer();
    
    // Convert to WebP with sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 }) // Adjust quality as needed
      .toBuffer();
    
    // Create a new file with the converted buffer
    const webpFile = new File(
      [webpBuffer], 
      file.name.replace(/\.[^/.]+$/, '.webp'), 
      { type: 'image/webp' }
    );
    
    return webpFile;
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    throw error;
  }
}

export function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
}