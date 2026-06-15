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
  // By default we skip Prisma steps during build to make deployments easier
  // and rely on Supabase for the production database. To enable the
  // Prisma DB push / seed steps during build set `USE_PRISMA=true` in
  // your build environment and provide a valid `DATABASE_URL`.
  if (process.env.USE_PRISMA === "true" && hasConfiguredDatabaseUrl()) {
    console.log("[build] USE_PRISMA=true and DATABASE_URL detected. Running prisma db push...");
    run("prisma db push");
    console.log("[build] Seeding database from Prisma seed script...");
    run("npm run db:seed");
  } else {
    console.log("[build] Skipping Prisma DB push/seed. If you need Prisma during build set USE_PRISMA=true and configure DATABASE_URL.");
  }

  console.log("[build] Running next build...");
  run("next build");
} catch (error) {
  process.exit(error?.status || 1);
}
