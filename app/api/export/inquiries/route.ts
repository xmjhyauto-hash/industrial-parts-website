import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const data = inquiries.map(inq => ({
      ID: inq.id,
      '产品名称': inq.productName,
      '产品型号': inq.productModel || '',
      '品牌': inq.productBrand || '',
      '客户邮箱': inq.customerEmail,
      '客户留言': inq.customerMessage || '',
      'IP': inq.ip || '',
      '状态': getStatusText(inq.status),
      '提交时间': inq.createdAt.toISOString(),
    }))

    if (format === 'excel') {
      const ExcelJS = await import('xlsx')
      const worksheet = ExcelJS.utils.json_to_sheet(data)
      const workbook = ExcelJS.utils.book_new()
      ExcelJS.utils.book_append_sheet(workbook, worksheet, '询价记录')

      // Set column widths
      worksheet['!cols'] = [
        { wch: 30 }, // ID
        { wch: 25 }, // 产品名称
        { wch: 15 }, // 型号
        { wch: 15 }, // 品牌
        { wch: 25 }, // 邮箱
        { wch: 40 }, // 留言
        { wch: 15 }, // IP
        { wch: 10 }, // 状态
        { wch: 20 }, // 时间
      ]

      const buffer = ExcelJS.write(workbook, { bookType: 'xlsx', type: 'buffer' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="inquiries-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Export inquiries error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    new: '新询价',
    read: '已读',
    replied: '已回复',
    closed: '已关闭',
  }
  return map[status] || status
}