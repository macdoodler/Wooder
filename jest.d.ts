// Global Jest type declarations
declare global {
  var window: any;
  namespace jest {
    interface Matchers<R> {
      toBeGreaterThanOrEqual(expected: number): R;
      toHaveLength(expected: number): R;
      toContain(expected: string): R;
    }
  }
}

export {};
