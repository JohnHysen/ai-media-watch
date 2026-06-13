import { sendEmail } from '.'
import cfg from '../../config'
import generateConfirmEmail from './email_templates/confirmEmail'

export const confEmail = async (email: string, activation_code: string) => {
  await sendEmail(
    email,
    'Подтвердите адрес вашей электронной почты!',
    generateConfirmEmail({
      link: `${cfg.CLIENT}/2-email?secret=${activation_code}`,
      client: cfg.CLIENT,
    })
  )
}
