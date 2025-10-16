import sql from "mssql";

const config = {
  server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.MSSQL_DATABASE,
  options: {
    enableArithAbort: true,
    encrypt: false,
    trustServerCertificate: true,
    useUTC: false
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

// Eğer USER ve PASSWORD varsa, SQL Authentication kullan
if (process.env.MSSQL_USER && process.env.MSSQL_PASSWORD) {
  config.user = process.env.MSSQL_USER;
  config.password = process.env.MSSQL_PASSWORD;
} else {
  // Windows Authentication
  config.options.trustedConnection = true;
}

let pool;
export async function getPool() {
  if (!pool) pool = await sql.connect(config);
  return pool;
}
export { sql };
