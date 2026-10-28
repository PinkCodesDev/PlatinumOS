import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

try {
  loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw new Error(
      'Cannot load the server .env file. Check file permissions.',
      {
        cause: error,
      },
    )
  }
}

// Server-only configuration. Never send this object to the browser or logs.
export const config = {
  host: '127.0.0.1',
  port: 3001,
  psnNpsso: process.env.PSN_NPSSO?.trim() || null,
}

export const isPsnConfigured = config.psnNpsso !== null
