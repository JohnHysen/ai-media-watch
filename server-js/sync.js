import 'dotenv/config'
import { execSync } from 'child_process'

const { SERVER_HOST, SERVER_USER, SERVER_PORT = 22, DEST_FOLDER } = process.env

const files = [
  'dist/index.js',
  'package.json',
  '.env.production',
  'ecosystem.config.cjs',
]

const scpFiles = files.join(' ')

console.log('Uploading server files...')
execSync(
  `scp -P ${SERVER_PORT} ${scpFiles} ${SERVER_USER}@${SERVER_HOST}:${DEST_FOLDER}`,
  { stdio: 'inherit', shell: true }
)

console.log('Installing production dependencies and starting/restarting PM2...')
const pm2Command = [
  `cd ${DEST_FOLDER}`,
  'pnpm install --prod',
  'pm2 describe mystrangeidol-server > /dev/null 2>&1 && pm2 restart mystrangeidol-server || pm2 start ecosystem.config.cjs --env production',
  'pm2 save',
].join(' && ')

execSync(
  `ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "${pm2Command}"`,
  { stdio: 'inherit', shell: true }
)

console.log('Deployment complete!')
