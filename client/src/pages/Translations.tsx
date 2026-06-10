import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useUser } from '../context/user/useUser'

const Translations = () => {
  const { t, i18n } = useTranslation()
  const { user } = useUser()
  const langs = [
    {
      v: 'kz',
      l: t('lang_kz'),
    },
    {
      v: 'ru',
      l: t('lang_ru'),
    },
    {
      v: 'en',
      l: t('lang_en'),
    },
  ]
  return (
    <Paper sx={{ p: 2 }}>
      <FormControl fullWidth>
        <InputLabel>{t('trans.title')}</InputLabel>
        <Select
          value={i18n.language}
          label={t('trans.title')}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
        >
          {langs.map((lang) => (
            <MenuItem value={lang.v}>
              <img
                height={15}
                src={`images/flags/${lang.v}.svg`}
                style={{ marginRight: 5 }}
              />
              {lang.l}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography variant="h4">{t('hello')}</Typography>
      <Typography variant="h4">{t('title.one')}</Typography>
      <Typography variant="h4">{t('title.two')}</Typography>
      <Typography variant="h4">{t('title.three')}</Typography>
      <Typography variant="h4">{t('subtitle')}</Typography>
      <Typography variant="h4">{t('good.evening')}</Typography>
      <Typography>
        {t('imputation', { email: user.email, id: user.tg_id })}
      </Typography>
      <Typography>{t('imputation2', { user })}</Typography>
    </Paper>
  )
}

export default Translations
