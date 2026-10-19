import assert from "node:assert/strict";
import test from "node:test";

import { parseTikTokPlayerEvent } from "@/lib/tiktok-player";

const playerWindow = {};

function event(data: unknown): Parameters<typeof parseTikTokPlayerEvent>[0] {
  return { origin: "https://www.tiktok.com", source: playerWindow, data };
}

function payload(type: string, value?: unknown): Record<string, unknown> {
  return { "x-tiktok-player": true, type, value };
}

test("ready messages need no value and ignore additional official fields", () => {
  assert.deepEqual(
    parseTikTokPlayerEvent(event({ "x-tiktok-player": true, type: "onPlayerReady" }), playerWindow),
    { type: "ready" },
  );
  assert.deepEqual(
    parseTikTokPlayerEvent(
      event({
        ...payload("onPlayerReady"),
        playerId: "fixture-player",
        futureField: { ready: true },
      }),
      playerWindow,
    ),
    { type: "ready" },
  );
});

test("all five numeric player states retain their exact value", () => {
  for (const value of [-1, 0, 1, 2, 3]) {
    assert.deepEqual(parseTikTokPlayerEvent(event(payload("onStateChange", value)), playerWindow), {
      type: "state",
      value,
    });
  }
});

test("mute messages preserve true and false without coercion", () => {
  for (const value of [true, false]) {
    assert.deepEqual(parseTikTokPlayerEvent(event(payload("onMute", value)), playerWindow), {
      type: "mute",
      value,
    });
  }
  for (const value of ["true", "false", 0, 1, null, undefined, {}, []]) {
    assert.equal(parseTikTokPlayerEvent(event(payload("onMute", value)), playerWindow), null);
  }
});

test("documented errors preserve finite integer codes and tolerate additional details", () => {
  for (const code of [1001, 2001, 3001, 3002, 9999]) {
    assert.deepEqual(
      parseTikTokPlayerEvent(
        event(
          payload("onPlayerError", { errorCode: code, errorType: "fixture", futureField: true }),
        ),
        playerWindow,
      ),
      { type: "error", code },
    );
  }
  assert.deepEqual(
    parseTikTokPlayerEvent(event(payload("onPlayerError", { errorCode: 3002 })), playerWindow),
    { type: "error", code: 3002 },
  );
});

test("only the exact HTTPS TikTok origin is accepted", () => {
  for (const origin of [
    "",
    "null",
    "http://www.tiktok.com",
    "https://tiktok.com",
    "https://www.tiktok.com/",
    "https://www.tiktok.com:443",
    "https://www.tiktok.com.evil.example",
    "https://player.tiktok.com",
    "https://www.instagram.com",
  ]) {
    assert.equal(
      parseTikTokPlayerEvent({ ...event(payload("onPlayerReady")), origin }, playerWindow),
      null,
      origin,
    );
  }
});

test("events must come from the expected nonnull player window by identity", () => {
  const message = event(payload("onPlayerReady"));
  assert.equal(parseTikTokPlayerEvent({ ...message, source: {} }, playerWindow), null);
  assert.equal(parseTikTokPlayerEvent({ ...message, source: null }, playerWindow), null);
  assert.equal(parseTikTokPlayerEvent(message, {}), null);
  assert.equal(parseTikTokPlayerEvent({ ...message, source: null }, null), null);
  assert.equal(parseTikTokPlayerEvent({ ...message, source: undefined }, undefined), null);
});

test("malformed envelopes and array payloads cannot impersonate a player", () => {
  const arrayPayload = Object.assign([], payload("onPlayerReady"));
  for (const data of [
    null,
    undefined,
    true,
    1,
    '{"x-tiktok-player":true,"type":"onPlayerReady"}',
    [],
    arrayPayload,
    {},
    { type: "onPlayerReady" },
  ]) {
    assert.equal(parseTikTokPlayerEvent(event(data), playerWindow), null);
  }
  for (const marker of [false, "true", "false", 0, 1, null, undefined, {}]) {
    assert.equal(
      parseTikTokPlayerEvent(
        event({ ...payload("onPlayerReady"), "x-tiktok-player": marker }),
        playerWindow,
      ),
      null,
    );
  }
});

test("unsupported or malformed state values are ignored instead of coerced", () => {
  for (const value of [
    "-1",
    "0",
    "1",
    "2",
    "3",
    -2,
    4,
    1.5,
    NaN,
    Infinity,
    true,
    null,
    undefined,
    {},
    [1],
  ]) {
    assert.equal(
      parseTikTokPlayerEvent(event(payload("onStateChange", value)), playerWindow),
      null,
    );
  }
});

test("errors require an object value and a finite integer numeric errorCode", () => {
  for (const value of [
    null,
    undefined,
    3002,
    "3002",
    [],
    Object.assign([], { errorCode: 3002 }),
    {},
    { errorCode: "3002" },
    { errorCode: true },
    { errorCode: null },
    { errorCode: NaN },
    { errorCode: Infinity },
    { errorCode: -Infinity },
    { errorCode: 3002.5 },
  ]) {
    assert.equal(
      parseTikTokPlayerEvent(event(payload("onPlayerError", value)), playerWindow),
      null,
    );
  }
});

test("unhandled official events and unknown message types are ignored", () => {
  for (const type of [
    "onCurrentTime",
    "onDurationChange",
    "onVolumeChange",
    "play",
    "ONPLAYERREADY",
    "",
    1,
    null,
    undefined,
  ]) {
    assert.equal(
      parseTikTokPlayerEvent(event({ ...payload("onPlayerReady"), type, value: 1 }), playerWindow),
      null,
    );
  }
});
