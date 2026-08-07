export default async function handler(req, res) {

  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://vademecum.vizta.lat'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET'
  );

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Falta el parámetro q' });
  }

  const slug = normalizar(q);

  const url = `https://www.alfabeta.net/precio/${slug}.html`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'No encontrado. Probá con el nombre comercial exacto (ej: "acemuk l").' });
    }

    const buffer = await response.arrayBuffer();
    const html = new TextDecoder('iso-8859-1').decode(buffer);
    if (req.query.debug) {
      return res.status(200).json({ html: html });
    }

    const data = extraerDatos(html);

    if (!data.presentaciones || data.presentaciones.length === 0) {
      return res.status(404).json({ error: 'No se pudo extraer el producto.' });
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

function extraerCoberturas(bloque) {
  const coberturas = [];
  const partes = bloque.split(/(?=<td class="obrasn")/).slice(1);

  partes.forEach(parte => {
    const nombreMatch = parte.match(/<td class="obrasn"[^>]*><b>([^<]+)<\/b><\/td>\s*<td class="obrasd"[^>]*>([^<]*)<\/td>/);
    if (!nombreMatch) return;

    const nombre = nombreMatch[1].trim();
    const descripcion = nombreMatch[2].trim() || null;

    const importes = [];
    const importeRegex = /(OS|AF)&nbsp;<b>\$([\d.,]+)<\/b>/g;
    let m;
    while ((m = importeRegex.exec(parte)) !== null) {
      importes.push({ tipo: m[1], precio: `$${m[2]}` });
    }

    coberturas.push({ nombre, descripcion, importes });
  });

  return coberturas;
}

function extraerDatos(htmlOriginal) {
  const html = limpiarComentarios(htmlOriginal);
  let nombre = null, laboratorio = null, droga = null, accion = null, descripcion = null;

  const ldMatch = htmlOriginal.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldMatch) {
    try {
      const json = JSON.parse(ldMatch[1]);
      nombre = json.name || null;
      laboratorio = (json.brand && json.brand.name) || null;
      if (json.additionalProperty) {
        const mono = json.additionalProperty.find(p => p.name === 'Monodroga');
        const acc = json.additionalProperty.find(p => p.name === 'Accion terapeutica');
        droga = mono ? mono.value : null;
        accion = acc ? acc.value : null;
      }
    } catch (e) {}
  }

  const resumenMatch = html.match(/<div class="producto-resumen"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
  if (resumenMatch) {
    descripcion = resumenMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  const bloques = html.split(/(?=<td class="tddesc")/).slice(1);

  const presentaciones = bloques.map(bloque => {
    const descMatch = bloque.match(/<td class="tddesc"[^>]*>([^<]*)/);
    const precioMatch = bloque.match(/<td class="tdprecio"[^>]*>\$([\d.,]+)/);
    const fechaMatch = bloque.match(/<td class="tdfecha"[^>]*>\(?([^<)]+)\)?<\/td>/);
    const coberturas = extraerCoberturas(bloque);

    return {
      presentacion: descMatch ? descMatch[1].trim() : null,
      precio: precioMatch ? `$${precioMatch[1]}` : null,
      fecha: fechaMatch ? fechaMatch[1].trim() : null,
      coberturas
    };
  }).filter(p => p.precio);

  return { nombre, laboratorio, droga, accion, descripcion, presentaciones, fuente: 'alfabeta.net' };
}
