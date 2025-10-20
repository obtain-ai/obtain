// ... existing code ...

declare global {
  namespace App {
    // ... existing interfaces ...
  }
}

declare module '$env/static/private' {
  export const NEWS_API_KEY: string;
  export const OPENAI_API_KEY: string;
}

export {};
