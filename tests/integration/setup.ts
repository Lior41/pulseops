import "dotenv/config";
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Set TEST_DATABASE_URL to a separate disposable test database.");
const parsed = new URL(url);
if (
  !parsed.pathname.endsWith("_test") &&
  !(parsed.hostname === "127.0.0.1" && parsed.port === "54330")
)
  throw new Error(
    "Integration database must end with _test, or use the local PGlite test port 54330.",
  );
if (url === process.env.DATABASE_URL)
  throw new Error("Refusing to test against the application database.");
process.env.DATABASE_URL = url;
