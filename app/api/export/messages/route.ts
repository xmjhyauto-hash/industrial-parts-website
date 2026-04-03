import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    const messages = await prisma.visitorMessage.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const data = messages.map(msg => ({
      ID: msg.id,
      '访客姓名': msg.name,
      '邮箱': msg.email || '',
      '电话': msg.phone || '',
      '留言内容': msg.message,
      'IP': msg.ip || '',
      '状态': getStatusText(msg.status),
      '提交时间': msg.createdAt.toISOString(),
    }))

    if (format === 'excel') {
      const ExcelJS = await import('xlsx')
      const worksheet = ExcelJS.utils.json_to_sheet(data)
      const workbook = ExcelJS.utils.book_new()
      ExcelJS.utils.book_append_sheet(workbook, worksheet, '留言记录')

      // Set column widths
      worksheet['!cols'] = [
        { wch: 30 }, // ID
        { wch: 15 }, // 姓名
        { wch: 25 }, // 邮箱
        { wch: 15 }, // 电话
        { wch: 40 }, // 留言内容
        { wch: 15 }, // IP
        { wch: 10 }, // 状态
        { wch: 20 }, // 时间
      ]

      const buffer = ExcelJS.write(workbook, { bookType: 'xlsx', type: 'buffer' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="messages-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Export messages error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    new: '新留言',
    read: '已读',
    replied: '已回复',
    closed: '已关闭',
  }
  return map[status] || status
}