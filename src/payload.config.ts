import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildConfig } from "payload";

import { createPayloadConfig } from "./payload/shared";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig(createPayloadConfig(dirname));
