import { describe, expect, it } from "vitest";
import { createInitialEngineState, applyAction, getValidMoves, pickAutoPlayCard } from "./engine";
import { EngineError, type CardId } from "./types";

function hand(...cards: CardId[]) {
  return cards;
}

describe("engine", () => {
  it("requires AS as first lead", () => {
    const state = createInitialEngineState(
      ["p1", "p2", "p3"],
      {
        p1: hand("AS", "2H"),
        p2: hand("KH", "3H"),
        p3: hand("QD", "4D"),
      },
    );
    expect(state.currentTurn).toBe("p1");
    expect(getValidMoves(state, "p1")).toEqual(["AS"]);
  });

  it("rejects out-of-turn play", () => {
    const state = createInitialEngineState(
      ["p1", "p2", "p3"],
      {
        p1: hand("AS", "2H"),
        p2: hand("KS", "3H"),
        p3: hand("QS", "4D"),
      },
    );
    expect(() =>
      applyAction(state, {
        actionId: "1",
        type: "PLAY_CARD",
        playerId: "p2",
        payload: { cardId: "KS" },
      }),
    ).toThrow(EngineError);
  });

  it("thulla ends trick and highest of led suit picks up", () => {
    let state = createInitialEngineState(
      ["p1", "p2", "p3"],
      {
        p1: hand("AS", "2D"),
        p2: hand("2S"),
        p3: hand("3H", "4H"),
      },
    );
    state = applyAction(state, {
      actionId: "a",
      type: "PLAY_CARD",
      playerId: "p1",
      payload: { cardId: "AS" },
    });
    state = applyAction(state, {
      actionId: "b",
      type: "PLAY_CARD",
      playerId: "p2",
      payload: { cardId: "2S" },
    });
    // p3 has no spades — thulla
    state = applyAction(state, {
      actionId: "c",
      type: "PLAY_CARD",
      playerId: "p3",
      payload: { cardId: "3H" },
    });
    expect(state.trickCards).toHaveLength(0);
    expect(state.players.p1!.hand).toEqual(expect.arrayContaining(["2D", "AS", "2S", "3H"]));
    expect(state.currentTurn).toBe("p1");
  });

  it("clean trick discards and highest leads", () => {
    let state = createInitialEngineState(
      ["p1", "p2", "p3"],
      {
        p1: hand("AS", "2D"),
        p2: hand("KS", "3H"),
        p3: hand("2S", "4H"),
      },
    );
    state = applyAction(state, {
      actionId: "a",
      type: "PLAY_CARD",
      playerId: "p1",
      payload: { cardId: "AS" },
    });
    state = applyAction(state, {
      actionId: "b",
      type: "PLAY_CARD",
      playerId: "p2",
      payload: { cardId: "KS" },
    });
    state = applyAction(state, {
      actionId: "c",
      type: "PLAY_CARD",
      playerId: "p3",
      payload: { cardId: "2S" },
    });
    expect(state.players.p1!.hand).toEqual(["2D"]);
    expect(state.players.p2!.hand).toEqual(["3H"]);
    expect(state.players.p3!.hand).toEqual(["4H"]);
    expect(state.currentTurn).toBe("p1");
  });

  it("marks escape and finishes when one remains", () => {
    let state = createInitialEngineState(
      ["p1", "p2", "p3"],
      {
        p1: hand("AS"),
        p2: hand("KS"),
        p3: hand("QS"),
      },
    );
    state = applyAction(state, {
      actionId: "a",
      type: "PLAY_CARD",
      playerId: "p1",
      payload: { cardId: "AS" },
    });
    state = applyAction(state, {
      actionId: "b",
      type: "PLAY_CARD",
      playerId: "p2",
      payload: { cardId: "KS" },
    });
    state = applyAction(state, {
      actionId: "c",
      type: "PLAY_CARD",
      playerId: "p3",
      payload: { cardId: "QS" },
    });
    // Clean trick: all three played their only card — all empty simultaneously.
    // After resolve, all have 0 cards. maybeFinish: active.length <= 1.
    expect(state.status).toBe("finished");
    expect(state.winnerId).toBeTruthy();
  });

  it("auto-picks lowest legal card", () => {
    const state = createInitialEngineState(
      ["p1", "p2", "p3"],
      {
        p1: hand("AS", "2H", "KH"),
        p2: hand("3C"),
        p3: hand("4C"),
      },
    );
    // After AS lead requirement satisfied conceptually — mustLeadAS true so only AS
    expect(pickAutoPlayCard(state, "p1")).toBe("AS");
  });
});
