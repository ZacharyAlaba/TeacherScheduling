const { execSync } = require("child_process");

function run(command) {
  execSync(command, {
    stdio: "inherit",
    shell: true,
  });
}

function hasConfiguredDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL || "";

  if (!databaseUrl) {
    return false;
  }

  return !databaseUrl.includes("username:password@host");
}

try {
  if (hasConfiguredDatabaseUrl()) {
    console.log("[build] DATABASE_URL detected. Running prisma db push...");
    run("prisma db push");
    console.log("[build] Seeding database from Prisma seed script...");
    run("npm run db:seed");
  } else {
    console.log("[build] No real DATABASE_URL configured. Skipping prisma db push.");
  }

  console.log("[build] Running next build...");
  run("next build");
} catch (error) {
  process.exit(error?.status || 1);
}
