import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
})

export const sendEmail = async (to_email, subject, html) => {
    const email = {
        from: process.env.MAIL_USER,
        to: to_email,
        subject,
        html
    }
    await transporter.sendMail(email);
}

export default transporter;