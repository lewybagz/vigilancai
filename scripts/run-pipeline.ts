/**
 * Run the monitoring pipeline from your terminal.
 *   npm run pipeline:run            # every due source
 *   npm run pipeline:run -- --force # every source, ignoring cadence
 */
import "dotenv/config";

async function main() {
  const force = process.argv.includes("--force");
  const { runDueSources } = await import("../src/lib/pipeline/run");
  const r = await runDueSources({ force });
  console.log(JSON.stringify(r, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
