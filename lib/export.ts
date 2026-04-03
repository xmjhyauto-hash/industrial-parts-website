import * as XLSX from 'xlsx'

/**
 * Convert data array to Excel buffer
 */
export function arrayToExcel(data: Record<string, unknown>[], filename: string): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

  // Set column widths
  const cols = Object.keys(data[0] || {})
  worksheet['!cols'] = cols.map(col => ({ wch: Math.max(col.length, 15) }))

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  return excelBuffer as unknown as Buffer
}

/**
 * Generate HTML for PDF printing
 */
export function generatePrintHTML(title: string, data: Record<string, unknown>[], headers?: Record<string, string>): string {
  const cols: string[] = headers ? Object.keys(headers) : Object.keys(data[0] || {})
  const headerRow = cols.map((col: string) => `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;">${headers?.[col] || col}</th>`).join('')
  const dataRows = data.map(row =>
    `<tr>${cols.map((col: string) => `<td style="border:1px solid #ddd;padding:8px;">${formatCell(row[col])}</td>`).join('')}</tr>`
  ).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .footer { margin-top: 20px; font-size: 10px; color: #999; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p style="font-size:12px;color:#666;">导出时间: ${new Date().toLocaleString('zh-CN')}</p>
  <table>
    <thead>
      <tr>${headerRow}</tr>
    </thead>
    <tbody>
      ${dataRows}
    </tbody>
  </table>
  <div class="footer">
    <p>本数据由工业零部件网站后台导出</p>
  </div>
  <div class="no-print" style="margin-top:20px;">
    <button onclick="window.print()" style="padding:10px 20px;cursor:pointer;">打印 / 保存 PDF</button>
  </div>
</body>
</html>
  `.trim()
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (value instanceof Date) return value.toLocaleString('zh-CN')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Trigger file download in browser
 */
export function downloadFile(buffer: Buffer, filename: string, mimeType: string) {
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Open HTML in new window for printing/PDF
 */
export function openPrintWindow(html: string) {
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}
