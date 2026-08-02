import productos from '../data/productos-completo.json' with { type: 'json' };

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vizta.lat');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(200).json({ resultados: [] });
  }

  const query = normalizar(q);

  const resultados = productos
    .filter(p => {
      return (
        normalizar(p.nombre || '').includes(query) ||
        normalizar(p.monodroga || '').includes(query) ||
        normalizar(p.laboratorio || '').includes(query)
      );
    })
    .slice(0, 8)
    .map(p => p.nombre);

  return res.status(200).json({ resultados });
}


function normalizar(texto) {
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}