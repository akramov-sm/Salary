import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Нативные/сложные пакеты libsql не должны бандлиться — запускаются как есть на сервере.
  serverExternalPackages: ["@libsql/client", "libsql", "@libsql/hrana-client"],
};

export default nextConfig;
