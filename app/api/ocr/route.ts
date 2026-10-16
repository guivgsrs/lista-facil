import { NextRequest, NextResponse } from 'next/server'
import { ocrShoppingList } from '@/lib/gemini'
import { assignSection } from '@/lib/store-map'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const rawItems = await ocrShoppingList(base64, mimeType)

    const items = rawItems.map((item, index) => ({
      name: item.name,
      qty: item.qty,
      section: assignSection(item.name),
      order_index: index,
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a imagem. Tente novamente.' },
      { status: 500 }
    )
  }
}
