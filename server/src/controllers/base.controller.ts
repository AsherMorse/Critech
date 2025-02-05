import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../middleware/error-handler'

export type AsyncRequestHandler<P = any, ResBody = any, ReqBody = any> = (
  req: Request<P, ResBody, ReqBody>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void>

export class BaseController {
  protected handleAsync<P = any, ResBody = any, ReqBody = any>(
    handler: AsyncRequestHandler<P, ResBody, ReqBody>
  ) {
    return async (req: Request<P, ResBody, ReqBody>, res: Response<ResBody>, next: NextFunction) => {
      try {
        await handler(req, res, next)
      } catch (error) {
        next(error)
      }
    }
  }

  protected validateId(id: string): number {
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) {
      throw new ApiError(400, 'Invalid ID format')
    }
    return parsedId
  }

  protected validateRequiredFields(data: any, fields: string[]) {
    const missingFields = fields.filter(field => !data[field])
    if (missingFields.length > 0) {
      throw new ApiError(400, 'Missing required fields', { fields: missingFields })
    }
  }
} 