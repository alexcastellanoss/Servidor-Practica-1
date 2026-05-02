import { IncomingWebhook } from '@slack/webhook';

const webhook = process.env.SLACK_WEBHOOK
    ? new IncomingWebhook(process.env.SLACK_WEBHOOK)
    : null;

export const loggerStream = {
    write: (message) => {
        if (webhook) {
            webhook.send({
                text: `🚨 *Error en API*\n\`\`\`${message}\`\`\``
            }).catch(err => console.error('Error enviando a Slack:', err));
        }
        console.error(message);
    }
};

export const sendSlackNotification = async (message) => {
    if (webhook) {
        try {
            await webhook.send({ text: message });
        } catch (err) {
            console.error('Error enviando a Slack:', err);
        }
    }
};

export const sendErrorToSlack = async (error, req) => {
    if (!webhook) return;

    const timestamp = new Date().toISOString();
    const statusCode = error.statusCode || 500;

    if (statusCode < 500) return;

    try {
        const errorMessage = {
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: `🚨 Error ${statusCode} en la API`,
                        emoji: true
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Timestamp:*\n${timestamp}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Método:*\n${req.method}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Ruta:*\n${req.originalUrl || req.url}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Status Code:*\n${statusCode}`
                        }
                    ]
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Mensaje de Error:*\n\`\`\`${error.message}\`\`\``
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Stack Trace:*\n\`\`\`${error.stack?.substring(0, 2000) || 'No disponible'}\`\`\``
                    }
                }
            ]
        };

        await webhook.send(errorMessage);
    } catch (err) {
        console.error('❌ Error enviando error a Slack:', err);
    }
};