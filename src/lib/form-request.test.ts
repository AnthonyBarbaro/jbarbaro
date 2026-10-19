import assert from "node:assert/strict";
import test from "node:test";

import { formReference, MAX_FORM_BODY_BYTES, readFormJson } from "@/lib/form-request";

test("form JSON reader rejects malformed, absent, and invalid UTF-8 data", async () => {
  for (const body of [undefined, "{", new Uint8Array([0xff])]) {
    const result = await readFormJson(
      new Request("https://form.example.test", { method: "POST", body }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.response.status, 400);
  }
});

test("form JSON reader enforces bytes with and without a declared length", async () => {
  for (const headers of [
    new Headers(),
    new Headers({ "content-length": "1" }),
    new Headers({ "content-length": String(MAX_FORM_BODY_BYTES + 1) }),
  ]) {
    const result = await readFormJson(
      new Request("https://form.example.test", {
        method: "POST",
        headers,
        body: JSON.stringify({ notes: "é".repeat(MAX_FORM_BODY_BYTES / 2) }),
      }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.response.status, 413);
  }
});

test("streamed oversized bodies stop reading and cancel after the byte limit", async () => {
  let pulls = 0;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        pulls += 1;
        controller.enqueue(new Uint8Array(4000));
      },
      cancel() {
        cancelled = true;
      },
    },
    { highWaterMark: 0 },
  );
  const request = new Request("https://form.example.test", {
    method: "POST",
    body,
    duplex: "half",
  } as RequestInit);
  const result = await readFormJson(request);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 413);
  assert.equal(pulls, 4);
  assert.equal(cancelled, true);
});

test("valid Unicode JSON is accepted at the exact body boundary", async () => {
  const body = JSON.stringify({ text: "é" });
  const padded = body + " ".repeat(MAX_FORM_BODY_BYTES - Buffer.byteLength(body));
  const result = await readFormJson(
    new Request("https://form.example.test", { method: "POST", body: padded }),
  );
  assert.deepEqual(result, { ok: true, value: { text: "é" } });
});

test("submission references are stable across safe retries and separate form kinds", () => {
  const id = "7d17922d-6a3a-4dfe-a848-fd80f45e9b77";
  const reference = formReference("CTC", id);
  assert.match(reference, /^CTC-[A-F0-9]{16}$/);
  assert.equal(formReference("CTC", id.toUpperCase()), reference);
  assert.notEqual(formReference("WDG", id), reference);
  assert.notEqual(formReference("CTC", "e27f2b2b-f888-4e10-9cee-cae889064bd2"), reference);
});
