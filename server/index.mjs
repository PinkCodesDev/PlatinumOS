import { createServer } from 'node:http'
// Configuration is loaded at startup; restart the server after editing .env.
import { config, isPsnConfigured } from './config.mjs'
import { createPsnAuth } from './psn-auth.mjs'
import { createPsnService } from './psn-service.mjs'
import { PsnError } from './psn-errors.mjs'

const auth = createPsnAuth({ npsso: config.psnNpsso })
const psn = createPsnService({ auth })

const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')

  if (request.method === 'GET' && request.url === '/api/psn/status') {
    response.writeHead(200)
    response.end(JSON.stringify(auth.status()))
    return
  }

  if (request.method === 'GET' && request.url === '/api/psn/games') {
    try {
      const data = await psn.getGames()
      response.writeHead(200)
      response.end(JSON.stringify(data))
    } catch (error) {
      response.writeHead(error instanceof PsnError ? error.status : 500)
      response.end(
        JSON.stringify({
          code: error instanceof PsnError ? error.code : 'INTERNAL_ERROR',
          error:
            error instanceof PsnError
              ? error.message
              : 'Unexpected server error.',
        }),
      )
    }
    return
  }

  if (request.method === 'GET' && request.url === '/api/health') {
    response.writeHead(200)
    response.end(
      JSON.stringify({
        status: 'ok',
        message: 'PlatinumOS server is running',
      }),
    )
    return
  }

  response.writeHead(404)
  response.end(
    JSON.stringify({
      error: 'Endpoint not found',
    }),
  )
})

server.listen(config.port, config.host, () => {
  console.log(`PlatinumOS API: http://${config.host}:${config.port}/api/health`)
  console.log(
    isPsnConfigured
      ? 'PSN: configured. Authentication starts when /api/psn/games is requested.'
      : 'PSN: not configured. PSN_NPSSO is empty or missing; health endpoint remains available.',
  )
})
