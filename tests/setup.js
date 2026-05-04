import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { Writable } from 'stream';

jest.mock('nodemailer', () => {
    const mockSendMail = jest.fn().mockResolvedValue({
        messageId: 'mock-message-id',
        accepted: ['test@example.com'],
        rejected: []
    });
    return {
        createTransport: jest.fn(() => ({
            sendMail: mockSendMail,
            verify: jest.fn().mockResolvedValue(true)
        }))
    };
});

jest.mock('sharp', () => {
    const chain = {
        resize: jest.fn().mockReturnThis(),
        toFormat: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-optimized-image')),
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600, format: 'webp' })
    };
    return jest.fn(() => chain);
});

jest.mock('cloudinary', () => {
    const makeUploadStream = (folder = '') => jest.fn((options, callback) => {
        const f = options.folder || folder;
        let url = 'https://mock.cloudinary.com/file';
        if (f.includes('signatures')) url = 'https://mock.cloudinary.com/signature.png';
        else if (f.includes('pdfs')) url = 'https://mock.cloudinary.com/pdf.pdf';
        else if (f.includes('logos')) url = 'https://mock.cloudinary.com/logo.png';

        const ws = new Writable({
            write(chunk, _enc, done) { done(); }
        });
        ws.on('finish', () =>
            callback(null, { secure_url: url, public_id: options.public_id || 'mock/file' })
        );
        return ws;
    });

    return {
        v2: {
            config: jest.fn(),
            uploader: {
                upload_stream: makeUploadStream(),
                destroy: jest.fn().mockResolvedValue({ result: 'ok' })
            }
        }
    };
});

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
        binary: { version: '6.0.9' }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});
