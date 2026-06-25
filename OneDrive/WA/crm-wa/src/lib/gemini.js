const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'

export async function lerComprovante(publicUrl) {
  console.log('Buscando imagem:', publicUrl)
  const response = await fetch(publicUrl)
  console.log('Status fetch:', response.status, response.ok)
  const blob = await response.blob()
  console.log('Blob tamanho:', blob.size, 'tipo:', blob.type)

  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  const base64 = btoa(binary)
  console.log('Base64 length:', base64.length)

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'minicpm-v',
      prompt: `Extract the exact monetary value (amount) shown in this receipt. Look for numbers written after R$, "valor", "total pago", "total". Return only the number with decimal dot. Example: 1500.00 If no value found return 0`,
      images: [base64],
      stream: false,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Ollama error: ${res.status} - ${errText}`)
  }

  const data = await res.json()
  const raw = (data?.response || '').trim()
  console.log('Modelo resposta bruta:', raw)
  const cleaned = raw.replace(/[^0-9.,]/g, '').replace(',', '.')
  const numeric = parseFloat(cleaned)
  console.log('Valor extraído:', numeric)
  return isNaN(numeric) ? null : numeric
}
