-- The interest list. One row per email address; a repeat entry updates the name and updated_at.
CREATE TABLE IF NOT EXISTS interest (
	email TEXT PRIMARY KEY,
	name TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	source TEXT NOT NULL DEFAULT 'page'
);
