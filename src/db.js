import sql from 'mssql';

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.MSSQL_DB || process.env.MSSQL_DATABASE,
  port: process.env.MSSQL_PORT
    ? parseInt(process.env.MSSQL_PORT, 10)
    : undefined,
  options: {
    enableArithAbort: true,
    encrypt: !!isProduction,
    trustServerCertificate: !isProduction,
    useUTC: false,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
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
