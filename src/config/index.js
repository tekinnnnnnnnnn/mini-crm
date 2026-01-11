require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    const username = decodeURIComponent(url.username || '');
    const password = decodeURIComponent(url.password || '');
    const database = (url.pathname || '').replace(/^\//, '');
    const port = url.port ? Number(url.port) : undefined;
    const sslFromQuery = url.searchParams.get('sslmode');
    const ssl =
      sslFromQuery === 'require' || sslFromQuery === 'verify-full' || sslFromQuery === 'verify-ca'
        ? true
        : undefined;

    return {
      dialect: url.protocol.replace(':', ''),
      host: url.hostname,
      port,
      database,
      username,
      password,
      ssl
    };
  } catch {
    return null;
  }
}

function requireInProd(name) {
  if (env !== 'production') return;
  if (!process.env[name]) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

const parsedDbUrl = process.env.DATABASE_URL ? parseDatabaseUrl(process.env.DATABASE_URL) : null;
if (env === 'production') {
  if (!process.env.DATABASE_URL) {
    requireInProd('DB_HOST');
    requireInProd('DB_NAME');
    requireInProd('DB_USER');
    requireInProd('DB_PASS');
  } else if (!parsedDbUrl) {
    throw new Error('Invalid DATABASE_URL');
  }
}

const dialect =
  process.env.DB_DIALECT || (parsedDbUrl?.dialect ? parsedDbUrl.dialect : env === 'test' ? 'sqlite' : 'postgres');

module.exports = {
  app: {
    env,
    port: Number(process.env.APP_PORT || 3000)
  },
  db: {
    host: parsedDbUrl?.host || process.env.DB_HOST || '127.0.0.1',
    port: parsedDbUrl?.port ?? Number(process.env.DB_PORT || 5432),
    database: parsedDbUrl?.database || process.env.DB_NAME || 'mini_crm_dev',
    username: parsedDbUrl?.username || process.env.DB_USER || 'postgres',
    password: parsedDbUrl?.password || process.env.DB_PASS || null,
    dialect,
    storage: dialect === 'sqlite' ? process.env.DB_STORAGE || ':memory:' : undefined,
    ssl: parsedDbUrl?.ssl ?? toBool(process.env.DB_SSL, false),
    logSql: toBool(process.env.LOG_SQL, env === 'development')
  },
  log: {
    level: process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
    requests: process.env.LOG_REQUESTS || (env === 'production' ? 'warn' : 'info'),
    slowRequestMs: Number(process.env.SLOW_REQUEST_MS || 1000)
  },
  order: {
    allowBackorder: toBool(process.env.ORDER_ALLOW_BACKORDER, false)
  }
};
