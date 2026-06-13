import dotenv from 'dotenv'

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
})

const e = process.env

const cfg = {
  DEV: e.DEV || false,
  DB_NAME: e.DB_NAME || 'tester',
  DB_USER: e.DB_USER || 'postgres',
  DB_PASSWORD: e.DB_PASSWORD || '12341234',
  DB_HOST: e.DB_HOST || 'localhost',
  DB_PORT: Number(e.DB_PORT) || 5432,
  CLIENT: e.CLIENT || 'http://localhost:3000',
  SERVER: e.SERVER || 'http://localhost:3500',
  GPT_KEY: e.GPT_KEY || 'xxxx',
  SECRET_KEY: e.SECRET_KEY || '123456789',
  TG_KEY: e.TG_KEY || 'xxxxx',
  GOOGLE_CLIENT_ID: e.GOOGLE_CLIENT_ID || 'xxxxx',
  GOOGLE_USER: e.GOOGLE_USER || 'tester@gmail.com',
  GOOGLE_APP_PASSWORD: e.GOOGLE_APP_PASSWORD || 'xxxx xxxx xxxx xxxx',
  PORT: Number(e.PORT) || 3500,
  OLLAMA_MODEL: e.OLLAMA_MODEL || 'qwen:8b',
}

export default cfg
