import { createApp } from "./app";
import { env } from "./utils/env";

const app = createApp();

app.listen(env.PORT, () => {
  // Keep startup output small and production-friendly.
  console.log(`Server listening on port ${env.PORT}`);
});

