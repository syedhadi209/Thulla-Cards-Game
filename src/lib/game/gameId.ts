const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateGameId(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return id;
}
