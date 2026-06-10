import 'dotenv/config'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'

const { SERVER_HOST, SERVER_USER, SERVER_PORT = 22, DEST_FOLDER } = process.env
const DIST_FOLDER = path.resolve('./dist')
const ARCHIVE_NAME = 'dist.zip'
const TMP_PATH = `/tmp/${ARCHIVE_NAME}` // Temporary upload path on server

// 1. Zip the folder using Node.js archiver
console.log('Zipping dist folder...')
await new Promise((resolve, reject) => {
  const output = fs.createWriteStream(ARCHIVE_NAME)
  const archive = archiver('tar', { gzip: true, gzipOptions: { level: 9 } })

  output.on('close', () => {
    console.log(`Archive ${ARCHIVE_NAME} created (${archive.pointer()} bytes)`)
    resolve()
  })
  archive.on('error', (err) => reject(err))

  archive.pipe(output)
  archive.directory(DIST_FOLDER, false)
  archive.finalize()
})

// 2. Copy the archive to /tmp on the server
const scpCommand = `scp -P ${SERVER_PORT} ${path.resolve('./' + ARCHIVE_NAME)} ${SERVER_USER}@${SERVER_HOST}:${TMP_PATH}`
console.log('Copying archive to server /tmp:', scpCommand)
execSync(scpCommand, { stdio: 'inherit', shell: true })

// 3. Unzip the archive into the destination folder using sudo, then remove the archive
const untarCommand = `ssh ${SERVER_USER}@${SERVER_HOST} -p ${SERVER_PORT} "sudo rm -rf ${DEST_FOLDER} && sudo mkdir -p ${DEST_FOLDER} && sudo tar -xzf ${TMP_PATH} -C ${DEST_FOLDER} && sudo rm ${TMP_PATH}"`
console.log('Unzipping archive on server:', untarCommand)
execSync(untarCommand, { stdio: 'inherit', shell: true })

// 4. Set permissions
const chmodCommand = `ssh ${SERVER_USER}@${SERVER_HOST} -p ${SERVER_PORT} "sudo chmod -R 777 ${DEST_FOLDER}"`
console.log('Change access:', chmodCommand)
execSync(chmodCommand, { stdio: 'inherit', shell: true })

// 5. Cleanup local zip
fs.unlinkSync(ARCHIVE_NAME)
console.log('Local archive removed. Deployment complete.')
