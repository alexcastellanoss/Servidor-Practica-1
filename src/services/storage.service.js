import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class StorageService {
    async uploadBuffer(buffer, options = {}) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: options.folder || 'bildyapp',
                    resource_type: options.resourceType || 'auto',
                    public_id: options.publicId,
                    transformation: options.transformation,
                    ...options
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            const readableStream = Readable.from(buffer);
            readableStream.pipe(uploadStream);
        });
    }

    async uploadSignature(buffer, deliveryNoteId) {
        return this.uploadBuffer(buffer, {
            folder: 'bildyapp/signatures',
            public_id: `signature_${deliveryNoteId}`,
            overwrite: true,
            transformation: [
                { width: 800, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        });
    }

    async uploadPDF(buffer, deliveryNoteId) {
        return this.uploadBuffer(buffer, {
            folder: 'bildyapp/pdfs',
            public_id: `deliverynote_${deliveryNoteId}`,
            resource_type: 'raw',
            overwrite: true
        });
    }

    async delete(publicId) {
        return cloudinary.uploader.destroy(publicId);
    }
}

export default new StorageService();