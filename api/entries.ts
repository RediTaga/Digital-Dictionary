import { applyCors } from './_cors.js';
import { requirePassphrase } from './_auth.js';
import { sql } from './_db.js';

function json(res: any, status: number, payload: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Routes:
 * - GET    /api/entries
 * - POST   /api/entries
 * - PUT    /api/entries?id=<uuid>
 * - DELETE /api/entries?id=<uuid>
 */
export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, word, definition, illustration, recording
        FROM dictionary_entries
        ORDER BY word ASC
      `;
      const entries = (rows as any[]).map((r) => ({
        id: r.id,
        word: r.word,
        definition: r.definition,
        illustration: r.illustration ?? '',
        recording: r.recording ?? null
      }));
      return json(res, 200, { entries });
    }

    // Protect writes
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      if (!requirePassphrase(req, res)) return;
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const word = (body?.word || '').toString().trim();
      const definition = (body?.definition || '').toString().trim();
      const illustration = (body?.illustration || '').toString().trim();
      const recording = body?.recording ? body.recording.toString() : null;

      if (!word || !definition || !illustration) {
        return json(res, 400, { error: 'Missing required fields' });
      }

      const rows = await sql`
        INSERT INTO dictionary_entries (word, definition, illustration, recording)
        VALUES (${word}, ${definition}, ${illustration}, ${recording})
        RETURNING id
      `;
      const row = (rows as any[])[0];

      return json(res, 201, {
        entry: { id: row.id, word, definition, illustration, recording }
      });
    }

    if (req.method === 'PUT') {
      if (!id) return json(res, 400, { error: 'Missing id' });

      const body = await readBody(req);
      const word = (body?.word || '').toString().trim();
      const definition = (body?.definition || '').toString().trim();
      const illustration = (body?.illustration || '').toString().trim();
      const recording = body?.recording ? body.recording.toString() : null;

      if (!word || !definition || !illustration) {
        return json(res, 400, { error: 'Missing required fields' });
      }

      const rows = await sql`
        UPDATE dictionary_entries
        SET word = ${word},
            definition = ${definition},
            illustration = ${illustration},
            recording = ${recording}
        WHERE id = ${id}
        RETURNING id
      `;
      if (!Array.isArray(rows) || rows.length === 0) {
        return json(res, 404, { error: 'Not found' });
      }

      return json(res, 200, {
        entry: { id, word, definition, illustration, recording }
      });
    }

    if (req.method === 'DELETE') {
      if (!id) return json(res, 400, { error: 'Missing id' });

      const rows = await sql`
        DELETE FROM dictionary_entries
        WHERE id = ${id}
        RETURNING id
      `;
      if (!Array.isArray(rows) || rows.length === 0) {
        return json(res, 404, { error: 'Not found' });
      }

      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (err: any) {
    console.error(err);
    return json(res, 500, { error: err?.message || 'Server error' });
  }
}
