import productos from '../data/productos-completo.json' with { type: 'json' };

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vizta.lat');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(200).json({ resultados: [] });
  }

  const query = normalizar(q);

  const encontrados = productos
    .map(p => ({
      ...p,
      score: puntaje(p, query)
    }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);

  const resultados = encontrados
    .slice(0, 8)
    .map(p => ({
      nombre: p.nombre,
      droga: p.droga,
      laboratorio: p.laboratorio,
      slug: p.slug
    }));

  return res.status(200).json({
    resultados,
    total: encontrados.length
  });
}

function normalizar(texto) {
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function empiezaPor(texto, query) {
  const palabras = normalizar(texto).split(/\s+/);
  return palabras.some(palabra => palabra.startsWith(query));
}

function puntaje(p, query) {
  const nombre = normalizar(p.nombre || '');
  const droga = normalizar(p.droga || '');
  const laboratorio = normalizar(p.laboratorio || '');
  const accion = normalizar(p.accion || '');

  // Coincidencias exactas
  if (nombre === query) return 100;
  if (droga === query) return 95;
  if (laboratorio === query) return 90;

  // Coincidencias por comienzo de palabra
  if (empiezaPor(nombre, query)) return 80;
  if (empiezaPor(droga, query)) return 75;
  if (empiezaPor(laboratorio, query)) return 70;
  if (empiezaPor(accion, query)) return 60;

  return 0;
}