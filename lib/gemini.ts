// Gemini vision — digitaliza foto da lista de compras

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'

export interface OcrItem { name: string; qty: number }

export async function ocrShoppingList(base64Image: string, mimeType: string): Promise<OcrItem[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const prompt = `Você está digitalizando uma lista de compras manuscrita em português brasileiro.
Analise a imagem com cuidado e extraia TODOS os itens visíveis na lista, mesmo que a caligrafia seja difícil de ler.

Regras importantes:
1. Capture o NOME COMPLETO do item, incluindo descrições entre parênteses e adjetivos (ex: "refil sabão roupa lavanda", "noz-moscada", "leite condensado").
2. Se uma linha tiver dois itens separados por " - " ou estiverem em colunas distintas, separe em dois itens distintos.
3. Extraia a QUANTIDADE se houver número junto ao item: "x10", "10x", "(2x)", "20 laranjas", "2 unidades" → qty = esse número. Sem número → qty = 1.
4. Números isolados antes de um item são a quantidade: "- 20 laranjas" → name: "laranjas", qty: 20.
5. NÃO inclua a quantidade no nome do item.
6. Não inclua cabeçalhos como "COMPRAS", "LISTA" ou similares.
7. Retorne os nomes em letras minúsculas, sem traços nem marcadores.

Retorne SOMENTE um array JSON de objetos {name, qty}:
[{"name": "sabão roupa lavanda", "qty": 1}, {"name": "noz-moscada", "qty": 1}, {"name": "limão", "qty": 10}]
Retorne APENAS o array JSON, sem texto adicional antes ou depois.`

  const requestBody = JSON.stringify({
    contents: [{
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Image } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  })

  const doFetch = () => fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: requestBody,
  })

  // Retry up to 3 times on 503 (high demand)
  let response = await doFetch()
  for (let attempt = 1; attempt < 3 && response.status === 503; attempt++) {
    await new Promise(r => setTimeout(r, attempt * 1500))
    response = await doFetch()
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${error}`)
  }

  const data = await response.json()
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'

  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []

  try {
    const raw = JSON.parse(match[0]) as unknown[]
    return raw
      .filter((item): item is OcrItem =>
        typeof item === 'object' && item !== null &&
        typeof (item as OcrItem).name === 'string' && (item as OcrItem).name.trim().length > 0
      )
      .map(item => ({ name: (item as OcrItem).name.trim(), qty: Math.max(1, Math.round(Number((item as OcrItem).qty) || 1)) }))
  } catch {
    return []
  }
}
