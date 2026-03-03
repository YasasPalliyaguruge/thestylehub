type UploadTarget = 'team' | 'portfolio'
type PortfolioVariant = 'before' | 'after'

interface SignatureResponse {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  resourceType: 'image'
}

interface UploadOptions {
  target: UploadTarget
  variant?: PortfolioVariant
}

export async function uploadImageToCloudinary(file: File, options: UploadOptions): Promise<string> {
  const signatureRes = await fetch('/api/admin/uploads/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target: options.target,
      variant: options.variant,
      resourceType: 'image',
      filename: file.name,
    }),
  })

  const signatureData = await signatureRes.json()
  if (!signatureRes.ok || !signatureData?.success) {
    throw new Error(signatureData?.error || 'Failed to create upload signature')
  }

  const signed = signatureData.data as SignatureResponse
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', signed.apiKey)
  form.append('timestamp', String(signed.timestamp))
  form.append('signature', signed.signature)
  form.append('folder', signed.folder)

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })

  const uploadData = await uploadRes.json()
  if (!uploadRes.ok) {
    throw new Error(uploadData?.error?.message || 'Cloudinary upload failed')
  }

  const secureUrl = String(uploadData?.secure_url || '')
  if (!secureUrl) throw new Error('Cloudinary did not return a secure URL')
  return secureUrl
}
