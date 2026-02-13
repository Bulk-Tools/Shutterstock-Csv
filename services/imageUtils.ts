/**
 * Resizes an image to ensure it does not exceed 1 megapixel (1,000,000 pixels).
 * This significantly reduces payload size and API processing time.
 */
export const compressImageTo1MP = (file: File): Promise<{ base64: string; originalSize: number; compressedSize: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const totalPixels = width * height;
        const MAX_PIXELS = 1000000; // 1 MegaPixel target

        // Calculate new dimensions if image is too large
        if (totalPixels > MAX_PIXELS) {
          const scaleFactor = Math.sqrt(MAX_PIXELS / totalPixels);
          width = Math.floor(width * scaleFactor);
          height = Math.floor(height * scaleFactor);
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as JPEG with 0.85 quality for good balance
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        // Remove data URL prefix for API usage
        const base64 = dataUrl.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
        
        // Calculate rough size in bytes for stats
        const compressedSize = Math.round((base64.length * 3) / 4);

        resolve({
          base64,
          originalSize: file.size,
          compressedSize
        });
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};