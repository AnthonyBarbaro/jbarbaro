import assert from "node:assert/strict";
import test from "node:test";

import { readSubmissionResponse, uncertainSubmission } from "@/lib/form-submission";

const reference = "CTC-0123456789ABCDEF";

test("form success requires an explicit receipt and a stable reference", async () => {
  assert.deepEqual(
    await readSubmissionResponse(
      Response.json({
        received: true,
        reference,
        message: "Message received.",
      }),
    ),
    { status: "success", reference, message: "Message received." },
  );

  for (const payload of [
    null,
    { message: "Message sent." },
    { received: false, reference, message: "Message sent." },
    { received: true, reference: "invalid", message: "Message sent." },
    { received: true, reference },
  ]) {
    const result = await readSubmissionResponse(Response.json(payload));
    assert.equal(result.status, "error");
    if (result.status === "error") assert.equal(result.retryAllowed, false);
  }
});

test("explicit validation and SMTP refusals allow a deliberate retry", async () => {
  for (const status of [400, 413, 422, 429, 503]) {
    const result = await readSubmissionResponse(
      Response.json(
        {
          received: false,
          retryAllowed: true,
          reference,
          message: "Your message was not sent.",
        },
        { status },
      ),
    );
    assert.equal(result.status, "error");
    if (result.status === "error") {
      assert.equal(result.retryAllowed, true);
      assert.equal(result.reference, reference);
    }
  }
});

test("uncertain, lost, and non-JSON responses do not permit a duplicate send", async () => {
  const responses = [
    Response.json({ received: false, retryAllowed: false, reference }, { status: 503 }),
    Response.json({ retryAllowed: true }, { status: 503 }),
    Response.json({ received: false, retryAllowed: true }, { status: 500 }),
    new Response("<html>Gateway error</html>", { status: 502 }),
    new Response("", { status: 200 }),
  ];
  for (const response of responses) {
    const result = await readSubmissionResponse(response);
    assert.equal(result.status, "error");
    if (result.status === "error") {
      assert.equal(result.retryAllowed, false);
      assert.match(result.message, /call the showroom/i);
    }
  }
  assert.match(uncertainSubmission(reference).message, new RegExp(reference));
});
