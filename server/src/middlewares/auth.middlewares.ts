import { Context, Next } from 'hono'
import { auth } from '~/config'

// Middleware to protect routes from unauthorized access
export const protect = async (c: Context, next: Next): Promise<Response | undefined> => {
  // Extract the session from the incoming request headers
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  // If no valid session or user is found, return an unauthorized response
  if (!session?.user) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized',
        error: 'No valid session found'
      },
      401
    )
  }

  console.log(session.user)
  // Optionally set the user and session on the context variables
  c.set('user', session.user)
  c.set('session', session.session)

  // Continue to the next middleware/handler
  await next()
}

// Middleware to protect admin routes
export const isAdmin = async (c: Context, next: Next): Promise<Response | undefined> => {
  // Extract the session from the incoming request headers
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  // If no valid session or user is found, return an unauthorized response
  if (!session?.user) {
    return c.json(
      {
        success: false,
        message: 'Unauthorized',
        error: 'No valid session found'
      },
      401
    )
  }

  return c.json(
    {
      success: false,
      message: 'Unauthorized',
      error: 'User is not an admin'
    },
    403
  )
}
