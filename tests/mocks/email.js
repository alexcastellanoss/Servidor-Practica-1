import { jest } from '@jest/globals';

export const getMockedSendEmail = async () => {
    const { sendEmail } = await import('../../src/config/mail.js');
    return sendEmail;
};

export const mockSendEmail = jest.fn().mockResolvedValue(undefined);

export const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({
        messageId: '<test-message-id@example.com>',
        accepted: ['destinatario@example.com'],
        rejected: []
    })
};

export default mockSendEmail;
