import carlo from "carlo";
import path from "path";
import { listen } from "@ledgerhq/logs";
import theme from "./renderer/theme";

(async () => {
  const app = await carlo.launch({
    bgcolor: theme.background,
    args: [],
  });
  app.on("exit", () => process.exit());
  console.log(path.join(__dirname, "../www"));
  app.serveFolder(path.join(__dirname, "../www"));
  await app.load("index.html");
  listen(log => {
    console.log(log);
    app.evaluate(log => {
      window && window._onLedgerLog && window._onLedgerLog(log);
    }, log);
  });
})();
