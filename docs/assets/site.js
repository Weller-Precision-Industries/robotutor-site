// Robotutor placeholder page: sends the interest form to the Worker named in config.js, and links the film to the form.
(() => {
	const endpoint = (window.ROBOTUTOR_INTEREST_ENDPOINT || '').trim();
	const form = document.getElementById('interest');
	const thanks = document.getElementById('thanks');
	const email = document.getElementById('email');
	const emailError = document.getElementById('email-error');
	const status = document.getElementById('form-status');
	const button = form.querySelector('button');
	const FAILED = 'That did not go through. Please try again, or write to support@robotutor.ai.';

	const showThanks = () => {
		form.hidden = true;
		thanks.hidden = false;
		thanks.focus();
	};

	// A browser without scripts posts the form straight to the Worker, which sends it back here with ?thanks=1.
	if (new URLSearchParams(location.search).get('thanks') === '1') showThanks();

	const emailOk = () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
	const markEmail = (ok) => {
		emailError.hidden = ok;
		if (ok) email.removeAttribute('aria-invalid');
		else email.setAttribute('aria-invalid', 'true');
	};
	email.addEventListener('input', () => {
		if (email.hasAttribute('aria-invalid') && emailOk()) markEmail(true);
	});

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		status.textContent = '';
		if (!emailOk()) {
			markEmail(false);
			email.focus();
			return;
		}
		markEmail(true);
		if (!endpoint) {
			status.textContent = FAILED;
			return;
		}
		button.disabled = true;
		const label = button.textContent;
		button.textContent = 'Sending…';
		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: email.value.trim(),
					name: form.elements.name.value.trim(),
					website: form.elements.website.value,
				}),
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok || !result.ok) throw new Error(result.error || String(response.status));
			showThanks();
		} catch {
			status.textContent = FAILED;
		} finally {
			button.disabled = false;
			button.textContent = label;
		}
	});

	// The film links to the form: when it ends, a button over the last frame leads to the email field.
	const film = document.getElementById('film');
	const cta = document.getElementById('film-cta');
	if (film && cta) {
		film.addEventListener('ended', () => (cta.hidden = false));
		film.addEventListener('play', () => (cta.hidden = true));
	}
	document.querySelectorAll('a[href="#interest"]').forEach((link) =>
		link.addEventListener('click', () => {
			if (!form.hidden) setTimeout(() => email.focus({ preventScroll: true }), 400);
		}),
	);
})();
