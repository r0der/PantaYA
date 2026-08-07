import productos from '../data/productos-completo.json' with { type: 'json' };

export default function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', 'https://vizta.lat');

  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(200).json({ total: 0, resultados: [] });
  }

  const query = normalizar(q);

  const encontrados = productos
    .map(p => ({
      ...p,
      score: puntaje(p, query)
    }))
    .filter(p => p.score > 0)
    .sort((a, b) => {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  return a.nombre.localeCompare(b.nombre, 'es', {
    sensitivity: 'base'
  });
});

  const resultados = encontrados.map(p => ({
    nombre: p.nombre,
    droga: p.droga,
    laboratorio: p.laboratorio,
    slug: p.slug
  }));

  return res.status(200).json({
    total: resultados.length,
    resultados
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
  if (droga === query) return 120;
  if (nombre === query) return 110;
  if (laboratorio === query) return 100;

  // La droga comienza exactamente con la búsqueda
  if (droga.startsWith(query)) return 90;

  // El nombre comercial comienza con la búsqueda
  if (nombre.startsWith(query)) return 80;

  // El laboratorio comienza con la búsqueda
  if (laboratorio.startsWith(query)) return 70;

  // Comienzo de cualquier palabra
  if (empiezaPor(droga, query)) return 60;
  if (empiezaPor(nombre, query)) return 50;
  if (empiezaPor(laboratorio, query)) return 40;
  if (empiezaPor(accion, query)) return 30;

  return 0;
}