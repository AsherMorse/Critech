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
  console.error('🔥 Error in request:')
  console.error('- URL:', req.url)
  console.error('- Method:', req.method)
  console.error('- Headers:', req.headers)
  console.error('- Error:', err)

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