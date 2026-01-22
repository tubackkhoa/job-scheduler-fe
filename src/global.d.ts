export {};

declare global {
  interface User {
    id: number;
    roles: Set<string>;
  }

  interface Window {
    ctx: { user: User };
    // or: ctx?: YourType
  }
}
