import { config } from 'dotenv'
import path from 'path'
import { query } from '../lib/db'
import { cloudinary, getCloudinaryConfig, getUploadFolder } from '../lib/cloudinary'

config({ path: '.env.local' })

interface TeamRow {
  id: string
  image_url: string | null
}

interface PortfolioRow {
  id: string
  before_image_url: string | null
  after_image_url: string | null
}

const DRY_RUN = !process.argv.includes('--apply')

function isLocalImagePath(url: string | null): url is string {
  return typeof url === 'string' && url.startsWith('/images/')
}

function toAbsoluteLocalPath(localUrl: string): string {
  return path.join(process.cwd(), 'public', localUrl.replace(/^\//, ''))
}

async function uploadLocalImage(localUrl: string, folder: string, publicIdSeed: string): Promise<string> {
  const absolutePath = toAbsoluteLocalPath(localUrl)
  const publicId = `${publicIdSeed}-${Date.now()}`
  const result = await cloudinary.uploader.upload(absolutePath, {
    resource_type: 'image',
    folder,
    public_id: publicId,
    overwrite: false,
    use_filename: false,
    unique_filename: false,
  })
  return result.secure_url
}

async function migrateTeamImages() {
  const teamRows = await query<TeamRow>('SELECT id, image_url FROM team_members')
  const folder = getUploadFolder('team')

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of teamRows) {
    if (!isLocalImagePath(row.image_url)) {
      skipped++
      continue
    }

    try {
      if (DRY_RUN) {
        console.log(`[DRY] team ${row.id}: ${row.image_url} -> ${folder}`)
      } else {
        const secureUrl = await uploadLocalImage(row.image_url, folder, `team-${row.id.slice(0, 8)}`)
        await query('UPDATE team_members SET image_url = $1 WHERE id = $2', [secureUrl, row.id])
        console.log(`[OK] team ${row.id}: ${secureUrl}`)
      }
      updated++
    } catch (error: any) {
      failed++
      console.error(`[FAIL] team ${row.id}: ${error?.message || String(error)}`)
    }
  }

  return { updated, skipped, failed }
}

async function migratePortfolioImages() {
  const rows = await query<PortfolioRow>('SELECT id, before_image_url, after_image_url FROM portfolio_items')
  const beforeFolder = getUploadFolder('portfolio', 'before')
  const afterFolder = getUploadFolder('portfolio', 'after')

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    let beforeUrl = row.before_image_url
    let afterUrl = row.after_image_url
    let changed = false

    try {
      if (isLocalImagePath(row.before_image_url)) {
        changed = true
        if (DRY_RUN) {
          console.log(`[DRY] portfolio(before) ${row.id}: ${row.before_image_url} -> ${beforeFolder}`)
        } else {
          beforeUrl = await uploadLocalImage(row.before_image_url, beforeFolder, `portfolio-before-${row.id.slice(0, 8)}`)
        }
      }

      if (isLocalImagePath(row.after_image_url)) {
        changed = true
        if (DRY_RUN) {
          console.log(`[DRY] portfolio(after) ${row.id}: ${row.after_image_url} -> ${afterFolder}`)
        } else {
          afterUrl = await uploadLocalImage(row.after_image_url, afterFolder, `portfolio-after-${row.id.slice(0, 8)}`)
        }
      }

      if (!changed) {
        skipped++
        continue
      }

      if (!DRY_RUN) {
        await query(
          'UPDATE portfolio_items SET before_image_url = $1, after_image_url = $2 WHERE id = $3',
          [beforeUrl, afterUrl, row.id]
        )
        console.log(`[OK] portfolio ${row.id}`)
      }

      updated++
    } catch (error: any) {
      failed++
      console.error(`[FAIL] portfolio ${row.id}: ${error?.message || String(error)}`)
    }
  }

  return { updated, skipped, failed }
}

async function run() {
  try {
    getCloudinaryConfig()
  } catch (error: any) {
    console.error(`Cloudinary config error: ${error?.message || String(error)}`)
    process.exit(1)
  }

  console.log(`Starting image migration (${DRY_RUN ? 'DRY RUN' : 'APPLY'})`)

  const team = await migrateTeamImages()
  const portfolio = await migratePortfolioImages()

  console.log('\nSummary')
  console.log(`Team: updated=${team.updated}, skipped=${team.skipped}, failed=${team.failed}`)
  console.log(`Portfolio: updated=${portfolio.updated}, skipped=${portfolio.skipped}, failed=${portfolio.failed}`)

  if (DRY_RUN) {
    console.log('\nDry run complete. Re-run with --apply to perform updates.')
  }
}

run().catch((error) => {
  console.error('Fatal migration error:', error)
  process.exit(1)
})
