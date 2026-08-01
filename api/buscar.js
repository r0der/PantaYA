export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vizta.lat');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

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
    return res.status(500).json({ error: 'Error al consultar Alfa Beta.', detalle: err.message });
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

function limpiarComentarios(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function formatearPrecio(precioNumerico) {
  const num = parseFloat(precioNumerico);
  if (isNaN(num)) return null;
  return '$' + num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function extraerDatos(htmlOriginal) {
  const html = limpiarComentarios(htmlOriginal);

  let nombre = null, laboratorio = null, droga = null, accion = null;
  let presentaciones = [];

  const ldMatch = htmlOriginal.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldMatch) {
    try {
      const json = JSON.parse(ldMatch[1]);
      nombre = json.name || null;
      laboratorio = (json.brand && json.brand.name) || null;
      if (json.offers && json.offers.length > 0) {
        presentaciones = json.offers.map(o => ({
          presentacion: o.name || null,
          precio: formatearPrecio(o.price)
        }));
      }
      if (json.additionalProperty) {
        const mono = json.additionalProperty.find(p => p.name === 'Monodroga');
        const acc = json.additionalProperty.find(p => p.name === 'Accion terapeutica');
        droga = mono ? mono.value : null;
        accion = acc ? acc.value : null;
      }
    } catch (e) {}
  }

  // Precio PAMI (solo lo asociamos a la primera presentación por simplicidad)
  let precioPami = null;
  const pamiMatch = html.match(/obrasn"><b>PAMI<\/b>[\s\S]{0,300}?class="importesi">[\s\S]*?\$([\d.,]+)/i);
  if (pamiMatch) precioPami = `$${pamiMatch[1]}`;

  return { nombre, laboratorio, droga, accion, presentaciones, precioPami, fuente: 'alfabeta.net' };
}
