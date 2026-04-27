import sharp from 'sharp';

class ImageService {
    async optimizeSignature(buffer, options = {}) {
        const {
            maxWidth = 800,
            quality = 80,
            format = 'webp'
        } = options;

        return sharp(buffer)
            .resize(maxWidth, null, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFormat(format, { quality })
            .toBuffer();
    }

    async optimizeImage(buffer, options = {}) {
        const {
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 80,
            format = 'webp'
        } = options;

        return sharp(buffer)
            .resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFormat(format, { quality })
            .toBuffer();
    }

    async getMetadata(buffer) {
        return sharp(buffer).metadata();
    }
}

export default new ImageService();