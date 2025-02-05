import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('🚨 ===============================')
  console.error('🚨 ERROR IN REQUEST')
  console.error('🚨 ===============================')
  console.error('🚨 URL:', req.url)
  console.error('🚨 Method:', req.method)
  console.error('🚨 Headers:', JSON.stringify(req.headers, null, 2))
  console.error('🚨 Error Name:', err.name)
  console.error('🚨 Error Message:', err.message)
  console.error('🚨 Error Stack:', err.stack)
  console.error('🚨 ===============================')

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    })
  } else {
    res.status(500).json({
      error: 'Internal server error'
    })
  }
} 