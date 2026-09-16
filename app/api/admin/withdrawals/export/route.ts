import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rechargeRequests, users } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { isAdminSessionValid } from '@/lib/admin-auth'

export async function GET() {
  const actor = await getCurrentUser()
  if (!await isAdminSessionValid() && actor?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await db.select({ id: rechargeRequests.id, createdAt: rechargeRequests.createdAt, amountPaise: rechargeRequests.amountPaise, status: rechargeRequests.status, upiId: rechargeRequests.upiId, accountName: rechargeRequests.accountName, accountNumber: rechargeRequests.accountNumber, ifscCode: rechargeRequests.ifscCode, utr: rechargeRequests.utr, userId: rechargeRequests.userId, userName: users.name, email: users.email, phone: users.phone }).from(rechargeRequests).leftJoin(users, eq(users.id, rechargeRequests.userId)).where(eq(rechargeRequests.method, 'withdrawal')).orderBy(desc(rechargeRequests.createdAt))
  const sheet = XLSX.utils.json_to_sheet(rows.map(row => ({
    'Request ID': row.id,
    'Date': row.createdAt?.toISOString() ?? '',
    'User ID': row.userId,
    'User name': row.userName ?? '',
    'Email': row.email ?? '',
    'Phone': row.phone,
    'Amount (INR)': row.amountPaise / 100,
    'Status': row.status,
    'UPI ID': row.upiId ?? '',
    'Account name': row.accountName ?? '',
    'Account number': row.accountNumber ?? '',
    'IFSC code': row.ifscCode ?? '',
    'Reference': row.utr,
  })))
  sheet['!cols'] = [{ wch: 38 }, { wch: 24 }, { wch: 38 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 24 }, { wch: 22 }, { wch: 16 }, { wch: 22 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Withdrawals')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buffer, { status: 200, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="kolkataff-withdrawals-${new Date().toISOString().slice(0, 10)}.xlsx"`, 'Cache-Control': 'no-store' } })
}
