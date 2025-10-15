import OpenAI from 'openai';
import { SECRET_OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({
	apiKey: SECRET_OPENAI_API_KEY
});

export { openai };
