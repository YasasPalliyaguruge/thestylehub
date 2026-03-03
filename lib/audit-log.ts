import { headers } from 'next/headers'
import { query } from './db'

export interface AuditLogEntry {
  admin_id: string
  action: string
  entity_type: string
  entity_id?: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

/**
 * Log an admin action to the audit log
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null
    const userAgent = headersList.get('user-agent') || null

    await query(
      `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.admin_id,
        entry.action,
        entry.entity_type,
        entry.entity_id || null,
        entry.changes ? JSON.stringify(entry.changes) : null,
        ipAddress,
        userAgent,
      ]
    )
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit log failures shouldn't break the main operation
  }
}

/**
 * Get audit logs for an admin
 */
export async function getAuditLogs(
  adminId: string,
  limit = 50
): Promise<Array<{ id: string; action: string; entity_type: string; created_at: string }>> {
  try {
    return await query(
      `SELECT id, action, entity_type, entity_id, changes, created_at
       FROM admin_audit_log
       WHERE admin_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [adminId, limit]
    )
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }
}

/**
 * Get recent audit logs across all admins
 */
export async function getRecentAuditLogs(limit = 100): Promise<any[]> {
  try {
    const logs = await query(
      `SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.changes,
        al.created_at,
        au.name as admin_name,
        au.email as admin_email
       FROM admin_audit_log al
       JOIN admin_users au ON al.admin_id = au.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    )
    return logs || []
  } catch (error) {
    console.error('Failed to fetch recent audit logs:', error)
    return []
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  limit = 20
): Promise<any[]> {
  try {
    return await query(
      `SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.changes,
        al.created_at,
        au.name as admin_name
       FROM admin_audit_log al
       JOIN admin_users au ON al.admin_id = au.id
       WHERE al.entity_type = $1 AND al.entity_id = $2
       ORDER BY al.created_at DESC
       LIMIT $3`,
      [entityType, entityId, limit]
    )
  } catch (error) {
    console.error('Failed to fetch entity audit logs:', error)
    return []
  }
}

// Action type constants for consistency
export const AuditActions = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  LOGIN: 'login',
  LOGOUT: 'logout',
  BULK_UPDATE: 'bulk_update',
  BULK_DELETE: 'bulk_delete',
} as const

// Entity type constants
export const AuditEntityTypes = {
  SERVICE: 'service',
  TEAM_MEMBER: 'team_member',
  PORTFOLIO: 'portfolio',
  TESTIMONIAL: 'testimonial',
  PRICING_PACKAGE: 'pricing_package',
  BUSINESS_INFO: 'business_info',
  HERO_CONTENT: 'hero_content',
  BOOKING: 'booking',
  CONTACT_MESSAGE: 'contact_message',
  ADMIN_USER: 'admin_user',
} as const
