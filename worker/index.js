// Receives the Robotutor interest form and stores each entry in the D1 database bound as DB.
// It stores an email, an optional name and two timestamps. It stores no IP address and writes nothing personal to logs.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY = 4096;
const MAX_EMAIL = 254;
const MAX_NAME = 100;
const MAX_NEW_PER_DAY = 5000; // stops a flood from filling the list; real interest is far below this

const json = (body, status, headers) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
	});

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const origin = request.headers.get('Origin') || '';
		const allowed = (env.ALLOWED_ORIGINS || '')
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);
		const cors = allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};

		if (url.pathname !== '/interest') return json({ ok: false, error: 'not_found' }, 404, cors);
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					...cors,
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
					'Access-Control-Max-Age': '86400',
				},
			});
		}
		if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405, { ...cors, Allow: 'POST, OPTIONS' });
		// Browsers always name their origin on a cross-site POST; one from any other site is refused.
		if (origin && !allowed.includes(origin)) return json({ ok: false, error: 'origin_not_allowed' }, 403, {});

		const type = (request.headers.get('Content-Type') || '').toLowerCase();
		const isJson = type.includes('application/json');
		const text = await request.text();
		if (text.length > MAX_BODY) return json({ ok: false, error: 'too_large' }, 413, cors);

		let fields;
		try {
			fields = isJson ? JSON.parse(text) : Object.fromEntries(new URLSearchParams(text));
		} catch {
			return json({ ok: false, error: 'bad_request' }, 400, cors);
		}
		if (!fields || typeof fields !== 'object') return json({ ok: false, error: 'bad_request' }, 400, cors);

		const done = () => {
			if (isJson) return json({ ok: true }, 200, cors);
			// A plain form post (no scripts in the browser) goes back to the page, which shows the thank-you message.
			return new Response(null, { status: 303, headers: { Location: `${env.SITE_URL}?thanks=1#thanks` } });
		};

		// The hidden "website" field is left empty by people. An entry that fills it is dropped without telling the sender.
		if (typeof fields.website === 'string' && fields.website.trim() !== '') return done();

		const email = typeof fields.email === 'string' ? fields.email.trim().toLowerCase() : '';
		const name = typeof fields.name === 'string' ? fields.name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME) : '';
		if (!email || email.length > MAX_EMAIL || !EMAIL.test(email)) return json({ ok: false, error: 'invalid_email' }, 400, cors);

		const now = new Date().toISOString();
		const dayAgo = new Date(Date.now() - 86400000).toISOString();
		const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM interest WHERE created_at > ?1').bind(dayAgo).first('n');
		if (recent >= MAX_NEW_PER_DAY) return json({ ok: false, error: 'busy' }, 429, cors);

		await env.DB.prepare(
			`INSERT INTO interest (email, name, created_at, updated_at, source) VALUES (?1, ?2, ?3, ?3, ?4)
			 ON CONFLICT(email) DO UPDATE SET name = COALESCE(excluded.name, interest.name), updated_at = excluded.updated_at`,
		)
			.bind(email, name || null, now, 'page')
			.run();

		return done();
	},
};
