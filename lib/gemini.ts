// Gemini vision — digitaliza foto da lista de compras

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent'

export async function ocrShoppingList(base64Image: string, mimeType: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const prompt = `Você está digitalizando uma lista de compras manuscrita em português brasileiro.
Analise a imagem com cuidado e extraia TODOS os itens visíveis na lista, mesmo que a caligrafia seja difícil de ler.
Os itens podem estar marcados com "-", "•", números ou simplesmente escritos em linhas.
Interprete abreviações e grafia informal — use o contexto de lista de compras para entender.
Retorne SOMENTE um array JSON de strings com os nomes dos itens em letras minúsculas, sem traços nem marcadores.
Não inclua cabeçalhos como "COMPRAS", "LISTA" ou similares.
Se a imagem estiver em ângulo ou parcialmente visível, extraia o que for possível ler.
Exemplo de saída: ["batata", "chocolate em pó", "farinha de trigo", "sabão em barra"]
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
  console.log('Gemini raw text:', text.slice(0, 500))
  console.log('Gemini finish reason:', data.candidates?.[0]?.finishReason)

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
