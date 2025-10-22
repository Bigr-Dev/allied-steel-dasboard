import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const fileName = 'load-plan-template.xlsx'
    const filePath = path.join(process.cwd(), 'public', 'templates', fileName)

    // ensure file exists
    try {
      const stat = await fs.promises.stat(filePath)
      if (!stat.isFile()) throw new Error('Not a file')
    } catch {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const fileBuffer = await fs.promises.readFile(filePath)

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    })
  } catch (err) {
    console.error('Error exporting template:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
