import 'dotenv/config'
import fs from 'fs'
import path from 'path'

const pkgPath = path.resolve('./package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
const dependencies = Object.keys(pkg.dependencies || [])

import { build } from 'esbuild'

build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  minify: true,
  external: ['fs', 'path', 'os', 'crypto', ...dependencies],
  legalComments: 'none',
}).catch(() => process.exit(1))
