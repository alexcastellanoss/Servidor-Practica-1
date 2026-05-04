import { jest } from '@jest/globals';

export const MOCK_URLS = {
    signature: 'https://mock.cloudinary.com/signature.png',
    pdf: 'https://mock.cloudinary.com/pdf.pdf',
    logo: 'https://mock.cloudinary.com/logo.png'
};

export const getMockedStorageService = async () => {
    const { default: storageService } = await import('../../src/services/storage.service.js');
    return storageService;
};

export const mockStorageService = {
    uploadSignature: jest.fn().mockResolvedValue({
        secure_url: MOCK_URLS.signature,
        public_id: 'bildyapp/signatures/test'
    }),
    uploadPDF: jest.fn().mockResolvedValue({
        secure_url: MOCK_URLS.pdf,
        public_id: 'bildyapp/pdfs/test'
    }),
    uploadLogo: jest.fn().mockResolvedValue({
        secure_url: MOCK_URLS.logo,
        public_id: 'bildyapp/logos/test'
    }),
    delete: jest.fn().mockResolvedValue({ result: 'ok' })
};

export default mockStorageService;
