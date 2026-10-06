import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(254, "Email is too long");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export const authFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const nicknameSchema = z
  .string()
  .trim()
  .min(2, "Nickname must be at least 2 characters")
  .max(20, "Nickname must be at most 20 characters")
  .regex(/^[a-zA-Z0-9 _.-]+$/, "Nickname contains invalid characters");

export const gameIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/, "Invalid game ID");

export const maxPlayersSchema = z.coerce.number().int().min(3).max(6);

export const createGameFormSchema = z.object({
  nickname: nicknameSchema,
  maxPlayers: maxPlayersSchema,
});

export const joinGameFormSchema = z.object({
  gameId: gameIdSchema,
  nickname: nicknameSchema,
});

export const createGameSchema = z.object({
  nickname: nicknameSchema,
  maxPlayers: z.number().int().min(3).max(6),
});

export const joinGameSchema = z.object({
  gameId: gameIdSchema,
  nickname: nicknameSchema,
});

export const gameIdOnlySchema = z.object({
  gameId: gameIdSchema,
});

export const cardIdSchema = z
  .string()
  .regex(/^(?:[2-9JQKA]|10)[SHDC]$/, "Invalid card ID");

export const playActionSchema = z.object({
  gameId: gameIdSchema,
  type: z.literal("PLAY_CARD"),
  payload: z.object({
    cardId: cardIdSchema,
  }),
});

export const rematchSchema = z.object({
  gameId: gameIdSchema,
});
