import { describe, expect, it } from "vitest";
import { createDeck, dealAll, shuffleDeck } from "./deck";

describe("deck", () => {
  it("creates 52 unique cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck).size).toBe(52);
    expect(deck).toContain("AS");
    expect(deck).toContain("KH");
  });

  it("shuffle preserves length and membership", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck, () => 0.42);
    expect(shuffled).toHaveLength(52);
    expect(new Set(shuffled).size).toBe(52);
    expect([...shuffled].sort()).toEqual([...deck].sort());
  });

  it("deals all cards across players", () => {
    const deck = createDeck();
    const hands = dealAll(deck, ["a", "b", "c"]);
    const total = Object.values(hands).reduce((n, h) => n + h.length, 0);
    expect(total).toBe(52);
    expect(hands.a!.length + hands.b!.length + hands.c!.length).toBe(52);
  });
});
