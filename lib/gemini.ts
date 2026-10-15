// Google Gemini 1.5 Flash — free tier, vision support
// Usado para digitalizar a foto da lista de compras

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export async function ocrShoppingList(base64Image: string, mimeType: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const prompt = `Você está ajudando a digitalizar uma lista de compras manuscrita em português brasileiro.
Olhe a imagem e extraia todos os itens marcados com "-" no início.
Retorne SOMENTE um array JSON de strings com os nomes dos itens, limpos e normalizados.
Não inclua o traço. Não inclua títulos ou cabeçalhos como "COMPRAS".
Ignore itens ilegíveis ou muito ambíguos.
Exemplo de saída: ["leite condensado", "azeite", "sal", "batata"]
Retorne apenas o array JSON, sem nenhum texto adicional.`

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Image } },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${error}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'

  // Extract JSON array from the response
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []

  try {
    const items = JSON.parse(match[0]) as string[]
    return items.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  } catch {
    return []
  }
}
