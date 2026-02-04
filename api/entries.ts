import { applyCors } from './_cors';
import { requirePassphrase } from './_auth';
import { sql } from './_db';

function json(res: any, status: number, payload: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
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

function nowMs() {
  return Date.now();
}

/**
 * REST-ish endpoint for dictionary entries.
 *
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
        SELECT id, word, definition, illustration, recording, created_at, updated_at
        FROM dictionary_entries
        ORDER BY word ASC
      `;
      const entries = (rows as any[]).map((r) => ({
        id: r.id,
        word: r.word,
        definition: r.definition,
        illustration: r.illustration ?? '',
        recording: r.recording ?? null,
        createdAt: Number(r.created_at),
        updatedAt: Number(r.updated_at),
      }));
      return json(res, 200, { entries });
    }

    // Require passphrase for writes (POST/PUT/DELETE)
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

      const t = nowMs();
      // Enforce case-insensitive uniqueness on word using a generated column + index in schema.
      // If user tries to insert a duplicate, we return 409.
      try {
        const rows = await sql`
          INSERT INTO dictionary_entries (word, definition, illustration, recording, created_at, updated_at)
          VALUES (${word}, ${definition}, ${illustration}, ${recording}, ${t}, ${t})
          RETURNING id, created_at, updated_at
        `;
        const row = (rows as any[])[0];
        return json(res, 201, {
          entry: {
            id: row.id,
            word,
            definition,
            illustration,
            recording,
            createdAt: Number(row.created_at),
            updatedAt: Number(row.updated_at),
          },
        });
      } catch (err: any) {
        // 23505 = unique_violation
        if (err?.code === '23505') {
          return json(res, 409, { error: 'Word already exists' });
        }
        throw err;
      }
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

      const t = nowMs();
      try {
        const rows = await sql`
          UPDATE dictionary_entries
          SET word = ${word},
              definition = ${definition},
              illustration = ${illustration},
              recording = ${recording},
              updated_at = ${t}
          WHERE id = ${id}
          RETURNING id, created_at, updated_at
        `;
        if (!Array.isArray(rows) || rows.length === 0) {
          return json(res, 404, { error: 'Not found' });
        }
        const row = (rows as any[])[0];
        return json(res, 200, {
          entry: {
            id: row.id,
            word,
            definition,
            illustration,
            recording,
            createdAt: Number(row.created_at),
            updatedAt: Number(row.updated_at),
          },
        });
      } catch (err: any) {
        if (err?.code === '23505') {
          return json(res, 409, { error: 'Word already exists' });
        }
        throw err;
      }
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
