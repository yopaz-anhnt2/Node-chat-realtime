import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

// "@/..." sẽ trỏ tới thư mục src/
const projectRoot = dirname(fileURLToPath(import.meta.url));
const srcUrl = pathToFileURL(join(projectRoot, "src") + "/").href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const resolved = new URL(specifier.slice(2), srcUrl).href;
    return nextResolve(resolved, context);
  }
  return nextResolve(specifier, context);
}
