import "dotenv/config";
import { once } from "node:events";
import { spawn } from "node:child_process";

const STARTUP_TIMEOUT_MS = 60_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(baseURL: string) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseURL, {
        method: "HEAD",
      });

      if (response.ok) {
        return;
      }
    } catch {
      // Ignore connection errors while the dev server is booting.
    }

    await sleep(1_000);
  }

  throw new Error(`Timed out waiting for ${baseURL} to become ready.`);
}

async function main() {
  const force = process.argv.includes("--force");
  const externalUrl = process.env.CMS_SEED_URL;
  const port = process.env.CMS_SEED_PORT || "3010";
  const secret = process.env.CMS_SEED_SECRET || "dev-seed-secret";
  const baseURL = externalUrl || `http://127.0.0.1:${port}`;
  let child: ReturnType<typeof spawn> | null = null;

  if (!externalUrl) {
    child = spawn("pnpm", ["next", "dev", "-p", port], {
      env: {
        ...process.env,
        CMS_SEED_SECRET: secret,
        PAYLOAD_AUTO_SEED: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout?.on("data", (chunk) => {
      process.stdout.write(chunk);
    });

    child.stderr?.on("data", (chunk) => {
      process.stderr.write(chunk);
    });

    try {
      await waitForServer(`${baseURL}/`);
    } catch (error) {
      child.kill("SIGINT");
      await once(child, "exit").catch(() => undefined);
      throw error;
    }
  }

  try {
    const response = await fetch(`${baseURL}/api/cms/seed`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-cms-seed-secret": secret,
      },
      body: JSON.stringify({ force }),
    });

    const body = await response.text();

    if (!response.ok) {
      throw new Error(`CMS seed request failed (${response.status}): ${body}`);
    }

    console.log(body);
  } finally {
    if (child) {
      child.kill("SIGINT");
      await once(child, "exit").catch(() => undefined);
    }
  }
}

main().catch((error) => {
  console.error("CMS seed failed:", error);
  process.exit(1);
});
