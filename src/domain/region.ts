export type Region = string & { readonly __brand: unique symbol };

export function createRegion(code: string): Region {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{2,10}$/.test(normalized)) {
    throw new Error(`Invalid region code: ${code}`);
  }
  return normalized as Region;
}

export function toApiRegion(region: Region): string {
  return region;
}

export function fromApiRegion(value: string): Region {
  return createRegion(value);
}
