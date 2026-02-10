declare global {
	namespace App {
		interface Locals {
			user: {
				username: string;
				displayName: string;
				createdAt: string;
			} | null;
		}
	}
}

declare module '$env/static/private' {
	export const NEWS_API_KEY: string;
	export const OPENAI_API_KEY: string;
}

export {};
