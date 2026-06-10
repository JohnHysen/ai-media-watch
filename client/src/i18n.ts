import i18n from 'i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

const fallbackLng = ['ru']
const availableLanguages = ['en', 'ru', 'kz']

i18n
  .use(Backend)

  .use(LanguageDetector)

  .use(initReactI18next)

  .init({
    fallbackLng,
    debug: true,
    supportedLngs: availableLanguages,
    load: 'languageOnly',
    ns: ['translation'],
    defaultNS: 'translation',

    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
