import { withAuth, apiError, apiResponse } from '@/lib/auth-helpers'
import { createSignedUploadParams } from '@/lib/cloudinary'
import { z } from 'zod'

const requestSchema = z.object({
  resourceType: z.enum(['image']).default('image'),
  target: z.enum(['team', 'portfolio']),
  variant: z.enum(['before', 'after']).optional(),
  filename: z.string().optional(),
})

export const POST = withAuth(async (_user, request) => {
  try {
    const body = await request.json()
    const validated = requestSchema.parse(body)

    if (validated.target === 'portfolio' && !validated.variant) {
      return apiError('Variant is required for portfolio uploads', 400)
    }

    const signed = createSignedUploadParams({
      target: validated.target,
      variant: validated.variant,
      resourceType: validated.resourceType,
    })

    return apiResponse({
      ...signed,
      filename: validated.filename || null,
    })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return apiError(error.errors?.[0]?.message || 'Invalid payload', 400)
    }
    return apiError(error?.message || 'Failed to generate upload signature', 500)
  }
})
