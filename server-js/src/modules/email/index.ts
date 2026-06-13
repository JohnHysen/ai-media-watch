import nodemailer from 'nodemailer'
import cfg from '../../config'

// Если у вас своя почта на сервере
// const mailTransportConfig = {
//   host: 'localhost',
//   port: 25,
//   secure: false,
//   tls: {
//     rejectUnauthorized: false,
//   },
// }

// Через Gmail
const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: cfg.GOOGLE_USER,
    pass: cfg.GOOGLE_APP_PASSWORD,
  },
})

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const res = await transport.sendMail({
      from: '"Tester" <noreply@tester.kz>',
      to,
      subject,
      text: html,
      html,
    })
    return res
  } catch (e) {
    console.log(e)
  }
}

export const sendEmailAtt = async (
  to: string,
  subject: string,
  html: string,
  att: Uint8Array,
  filename: string
) => {
  const res = await transport.sendMail({
    from: '"Tester" <noreply@tester.kz>',
    to,
    subject,
    text: html,
    html,
    attachments: [
      {
        filename: filename,
        content: Buffer.from(att),
      },
    ],
  })
  return res
}
