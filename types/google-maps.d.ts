/// <reference types="@types/google.maps" />

declare namespace google.maps {
  // Minimal ambient types when @types/google.maps is not installed
  class Map {
    constructor(el: HTMLElement, opts?: Record<string, unknown>);
  }
  class Marker {
    constructor(opts?: Record<string, unknown>);
    setMap(map: Map | null): void;
    addListener(event: string, fn: () => void): void;
  }
  enum SymbolPath {
    CIRCLE = 0,
  }
}
