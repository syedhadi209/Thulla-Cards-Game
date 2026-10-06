# Thulla (Getaway) — Official Rules for This Project

This document defines the exact rule set implemented by the server-side rule engine.
Variant: **Standard Getaway / Thulla (Pagat)**. No 2-player shootout.

## Players

- Minimum: 3
- Maximum: 6
- Host configures `maxPlayers` at game creation; game starts only when that exact count has joined.

## Deck

- One standard 52-card deck, no jokers.
- Ranks (high → low): A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2.
- Suits: Spades (S), Hearts (H), Diamonds (D), Clubs (C). Suits are used only for following; there is no trump.
- Card IDs: `{rank}{suit}` e.g. `AS`, `KH`, `10D`, `2C`.

## Deal

- Server shuffles with a cryptographically secure RNG (Fisher–Yates).
- Entire deck is dealt clockwise, one card at a time, as evenly as possible.
- Some players may receive one more card than others; this is valid.

## Objective

- Shed all cards to **escape**.
- The last player still holding cards is the **loser** (Thulla).
- The first player to escape is the **winner** for UI display.
- Escape order is recorded for the result screen.

## Opening Lead

- The player who holds the **Ace of Spades (`AS`)** must lead it as the first card of the game.
- After that, the leader of each trick may lead any card from their hand.

## Trick Play

1. The current leader plays a card face-up. Its suit is the **led suit**.
2. Play proceeds clockwise among **active** players (not yet escaped).
3. Each player must follow the led suit if they hold any card of that suit.
4. If a player cannot follow suit, they may play any card — this is a **thulla**.
5. A thulla **ends the trick immediately**. Players after the thulla do not play.

## Resolving a Trick

### Clean trick (everyone followed suit)

- All cards in the trick are discarded from the game (removed from play).
- The player who played the **highest card of the led suit** leads the next trick.

### Thulla trick

- The player who played the **highest card of the led suit** picks up **all** cards in the trick and adds them to their hand.
- That same player leads the next trick.

## Escaping

- When a player’s hand reaches zero cards after a resolution, they **escape**.
- Escaped players are removed from turn order and do not play further.
- Their public `cardCount` is 0 and `status` is `escaped`.

## End of Game

- When only **one** active player remains with cards, the game ends.
- That remaining player is the **loser**.
- Status becomes `finished`.
- No further gameplay actions are accepted.

## Turn Timer

- Each turn has a server-owned deadline (default 20 seconds).
- If the player does not act in time, the server auto-plays the **lowest legal** card (by rank, then suit order S < H < D < C).

## Actions

- Client gameplay action for MVP: `PLAY_CARD` with `{ cardId }`.
- All actions require a unique `actionId` for idempotency.

## What Is Not In This Variant

- No shootout / discard-pile draw endgame for two players.
- No jokers, wild cards, or trump suits.
- No points-based scoring beyond escape order / loser identification.
