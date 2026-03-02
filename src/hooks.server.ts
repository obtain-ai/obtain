import type { Handle } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('obtain_session');

	if (token) {
		const user = await getUserFromSession(token);
		event.locals.user = user;
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
