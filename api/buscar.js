export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta el parámetro q' });

  const slug = normalizar(q);
  const url = `https://www.alfabeta.net/precio/${slug}.html`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'No encontrado. Probá con el nombre comercial exacto (ej: "acemuk l").' });
    }

    const html = await response.text();
    const data = extraerDatos(html);

    if (!data.precio) {
      return res.status(404).json({ error: 'No se pudo extraer el precio de esa página.' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Error al consultar Alfa Beta.' });
  }
}

function normalizar(texto) {
  return texto
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function extraerDatos(html) {
  const nombreMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const precioMatch = html.match(/\$\s?([\d.]+,\d{2})/);
  const pamiMatch = html.match(/PAMI[\s\S]{0,200}?\$\s?([\d.]+,\d{2})/i);

  return {
    nombre: nombreMatch ? nombreMatch[1].trim() : texto,
    precio: precioMatch ? `$${precioMatch[1]}` : null,
    precioPami: pamiMatch ? `$${pamiMatch[1]}` : null,
    fuente: 'alfabeta.net'
  };
}  
