import { v2 as cloudinary } from 'cloudinary'

type UploadTarget = 'team' | 'portfolio'
type PortfolioVariant = 'before' | 'after'

interface SignatureInput {
  target: UploadTarget
  variant?: PortfolioVariant
  resourceType?: 'image'
}

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

export function getCloudinaryConfig() {
  const cloudName = getEnv('CLOUDINARY_CLOUD_NAME')
  const apiKey = getEnv('CLOUDINARY_API_KEY')
  const apiSecret = getEnv('CLOUDINARY_API_SECRET')
  const baseFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'stylehub'

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  return {
    cloudName,
    apiKey,
    apiSecret,
    baseFolder,
  }
}

export function getUploadFolder(target: UploadTarget, variant?: PortfolioVariant): string {
  const { baseFolder } = getCloudinaryConfig()
  if (target === 'team') return `${baseFolder}/team`
  if (variant === 'before') return `${baseFolder}/portfolio/before`
  if (variant === 'after') return `${baseFolder}/portfolio/after`
  return `${baseFolder}/portfolio`
}

export function createSignedUploadParams(input: SignatureInput) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = getUploadFolder(input.target, input.variant)
  const resourceType = input.resourceType || 'image'

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    apiSecret
  )

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    resourceType,
  }
}

export { cloudinary }
