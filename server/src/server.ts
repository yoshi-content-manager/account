import '~/config/compress.config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
// import { compress } from 'hono/compress'
//
import { Users } from '~/routes'
import { auth } from '~/config'
import { errorHandler, notFound } from '~/middlewares'

const baseUrl = process.env.APP_URL ?? 'http://localhost:8001'

// Initialize the Hono app with base path
const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>({ strict: false })

// Determine the environment
const port = process.env?.PORT || 4002
const API_BASE = process.env.API_BASE || '/api/v1'

// Custom logger that skips /health endpoint
const customLogger = (msg: string, ...rest: string[]): void => {
  // `rest` typically contains method and path info
  // Alternatively, perform path checking inside middleware if more control is needed
  if (msg.includes('GET /health') || rest.some((s) => s.includes('/health'))) return
  console.log(msg, ...rest)
}


// Logger middleware
app.use(logger(customLogger))

// Compress middleware
// TODO publish two endpoints, one internal (no gzip) and one external (gzip)
// Nextcloud bugs when gzip is enabled
// app.use(compress({ encoding: 'gzip' }))

// CORS configuration (tightened for security)
app.use(
  '*',
  cors({
    origin: [
      baseUrl,
      ...(process.env.EXTRA_CORS_ORIGINS || '').split(',')
    ], // Specify allowed origins (update for production)
    credentials: true,
    maxAge: 86400 // Cache preflight for 1 day
  })
)

// Home Route
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to the API'
  })
})

// Better-Auth - Handle all auth routes
app.all('/api/auth/*', async (c) => {
  return await auth.handler(c.req.raw)
})

// Users Route
app.route(API_BASE + '/users', Users)

app.get('/.well-known/jwks.json', async (c) => {
  const response = await fetch(`http://localhost:${port}/api/auth/jwks`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return c.json(await response.json())
})

app.get('/.well-known/openid-configuration', (c) => {
  return c.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/auth/oauth2/authorize`,
    token_endpoint: `${baseUrl}/api/auth/oauth2/token`,
    userinfo_endpoint: `${baseUrl}/api/auth/oauth2/userinfo`,
    jwks_uri: `${baseUrl}/api/auth/.well-known/jwks.json`,
    scopes_supported: ['openid', 'profile', 'email'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    subject_types_supported: ['public']
  })
})

// Health Route (for Kubernetes liveness probe)
app.get('/health', (c) => c.text('OK'))

// Error Handler (improved to use err)
app.onError(errorHandler)

// Not Found Handler (standardized response)
app.notFound(notFound)

// Export for both Bun and Cloudflare Workers
export default {
  port,
  fetch: app.fetch
}
