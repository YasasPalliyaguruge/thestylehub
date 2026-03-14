'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AdminPageTransition } from '@/components/admin/ui'

interface InvoiceItem {
  name: string
  qty: number
  unit_price: number
}

interface Invoice {
  id: string
  invoice_number: string
  booking_id?: string | null
  customer_name: string
  customer_email?: string | null
  customer_phone?: string | null
  items: InvoiceItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method?: string | null
  status: string
  paid_at?: string | null
  created_at: string
  staff_name?: string | null
  assigned_employee_name?: string | null
}

interface BusinessInfo {
  salon_name?: string
  tagline?: string
  address?: string
  phone?: string
  email?: string
}

function InvoicePrintInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [business, setBusiness] = useState<BusinessInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const shouldAutoPrint = searchParams.get('print') === '1'

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/admin/pos/invoices/${invoiceId}`)
        const data = await response.json()
        if (!response.ok) {
          setError(data.error || 'Failed to load invoice')
          return
        }
        setInvoice(data.data?.invoice || null)
        setBusiness(data.data?.business || null)
      } catch (err) {
        console.error('Failed to fetch invoice:', err)
        setError('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [invoiceId])

  useEffect(() => {
    if (!shouldAutoPrint || loading) return
    const timer = window.setTimeout(() => window.print(), 300)
    return () => window.clearTimeout(timer)
  }, [shouldAutoPrint, loading])

  const createdDate = useMemo(() => {
    if (!invoice?.created_at) return ''
    return new Date(invoice.created_at).toLocaleString()
  }, [invoice?.created_at])

  const addressLines = useMemo(() => {
    if (!business?.address) return []
    return business.address
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }, [business?.address])

  if (loading) {
    return (
      <AdminPageTransition>
        <div className="admin-card text-gray-300">Loading invoice...</div>
      </AdminPageTransition>
    )
  }

  if (!invoice) {
    return (
      <AdminPageTransition>
        <div className="admin-card text-red-300">{error || 'Invoice not found'}</div>
      </AdminPageTransition>
    )
  }

  return (
    <div className="receipt-page min-h-screen bg-white text-black px-4 py-6 sm:px-6 sm:py-8 print:px-0 print:py-0">
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body,
          .receipt-page {
            background: #fff !important;
            margin: 0;
            color: #000 !important;
            font-family: "Courier New", ui-monospace, Menlo, Monaco, "Liberation Mono", monospace;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt-container,
          .receipt-container * {
            color: #000 !important;
            background: transparent !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }

        .receipt-page {
          font-family: Arial, sans-serif;
        }

        .receipt-container {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
          border: 1px solid #e5e7eb;
          padding: 20px 18px 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        @media print {
          .receipt-container {
            width: 72mm;
            max-width: 72mm;
            border: none;
            box-shadow: none;
            padding: 4mm 4mm 6mm;
          }
        }

        .receipt-logo {
          display: block;
          width: 32mm;
          max-width: 140px;
          height: auto;
          margin: 0 auto 8px;
          image-rendering: crisp-edges;
        }

        .receipt-title {
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .receipt-subtitle {
          text-align: center;
          font-size: 11px;
          color: #555;
          line-height: 1.35;
        }

        .receipt-meta {
          margin-top: 12px;
          font-size: 11px;
          color: #333;
          line-height: 1.4;
        }

        .receipt-divider {
          border-top: 1px solid #cfcfcf;
          margin: 10px 0;
        }

        .receipt-section-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #666;
          margin-bottom: 6px;
        }

        .receipt-item {
          padding: 6px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .receipt-item:last-child {
          border-bottom: none;
        }

        .receipt-item-name {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .receipt-item-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #444;
        }

        .receipt-totals {
          font-size: 11px;
          line-height: 1.45;
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 4px;
        }

        .receipt-row.total {
          font-size: 12px;
          font-weight: 700;
          border-top: 1px solid #ddd;
          padding-top: 6px;
          margin-top: 8px;
        }

        .receipt-footer {
          text-align: center;
          font-size: 10px;
          color: #666;
          margin-top: 12px;
        }

        @media print {
          .receipt-logo {
            filter: grayscale(100%);
            image-rendering: crisp-edges;
          }

          .receipt-divider {
            border-top: 1px solid #000;
          }

          .receipt-item {
            border-bottom: 1px solid #000;
          }

          .receipt-row.total {
            border-top: 1px solid #000;
          }
        }
      `}</style>

      <div className="no-print max-w-3xl mx-auto mb-6 flex items-center justify-between">
        <Link href="/admin/pos" className="admin-btn-secondary">
          Back to POS
        </Link>
        <button onClick={() => window.print()} className="admin-btn-primary">
          Print Invoice
        </button>
      </div>

      <div className="receipt-container">
        <img src="/images/logobw.png" alt="The Style Hub" className="receipt-logo" />
        <div className="receipt-title">{business?.salon_name || 'The Style Hub'}</div>
        {business?.tagline && <div className="receipt-subtitle">{business.tagline}</div>}
        {addressLines.length > 0 && (
          <div className="receipt-subtitle">
            {addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        )}
        {business?.phone && <div className="receipt-subtitle">{business.phone}</div>}
        {business?.email && <div className="receipt-subtitle">{business.email}</div>}

        <div className="receipt-divider" />

        <div className="receipt-meta">
          <div>Invoice: {invoice.invoice_number}</div>
          <div>Date: {createdDate}</div>
          {invoice.assigned_employee_name
            ? <div>Staff: {invoice.assigned_employee_name}</div>
            : invoice.staff_name ? <div>Staff: {invoice.staff_name}</div> : null}
        </div>

        <div className="receipt-divider" />

        <div className="receipt-section-title">Bill To</div>
        <div className="receipt-meta">
          <div>{invoice.customer_name}</div>
          {invoice.customer_email && <div>{invoice.customer_email}</div>}
          {invoice.customer_phone && <div>{invoice.customer_phone}</div>}
        </div>

        <div className="receipt-divider" />

        <div className="receipt-section-title">Items</div>
        {invoice.items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="receipt-item">
            <div className="receipt-item-name">{item.name}</div>
            <div className="receipt-item-meta">
              <span>
                {item.qty} x LKR {item.unit_price.toLocaleString()}
              </span>
              <span>LKR {(item.qty * item.unit_price).toLocaleString()}</span>
            </div>
          </div>
        ))}

        <div className="receipt-divider" />

        <div className="receipt-totals">
          <div className="receipt-row">
            <span>Subtotal</span>
            <span>LKR {invoice.subtotal.toLocaleString()}</span>
          </div>
          <div className="receipt-row">
            <span>Tax</span>
            <span>LKR {invoice.tax.toLocaleString()}</span>
          </div>
          <div className="receipt-row">
            <span>Discount</span>
            <span>LKR {invoice.discount.toLocaleString()}</span>
          </div>
          <div className="receipt-row total">
            <span>Total</span>
            <span>LKR {invoice.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-meta">
          <div>Payment: {invoice.payment_method || 'Not specified'}</div>
          <div>Status: {invoice.status}</div>
        </div>

        <div className="receipt-footer">
          Thank you for choosing {business?.salon_name || 'The Style Hub'}.
        </div>
      </div>
    </div>
  )
}

export default function InvoicePrintPage() {
  return (
    <Suspense
      fallback={
        <AdminPageTransition>
          <div className="admin-card text-gray-300">Loading invoice...</div>
        </AdminPageTransition>
      }
    >
      <InvoicePrintInner />
    </Suspense>
  )
}
