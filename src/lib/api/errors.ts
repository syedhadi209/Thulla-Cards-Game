import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_ARGUMENT"
  | "GAME_NOT_FOUND"
  | "GAME_FULL"
  | "GAME_ALREADY_STARTED"
  | "GAME_NOT_JOINABLE"
  | "GAME_FINISHED"
  | "NOT_GAME_MEMBER"
  | "NOT_HOST"
  | "NOT_YOUR_TURN"
  | "CARD_NOT_IN_HAND"
  | "INVALID_MOVE"
  | "NICKNAME_TAKEN"
  | "NOT_ENOUGH_PLAYERS"
  | "INTERNAL";

export function apiError(code: ApiErrorCode, message: string, status = 400) {
  return NextResponse.json({ code, message }, { status });
}

export function apiOk<T extends object>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
