import mysql from 'mysql2/promise';
import config from './config.js';

const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: config.database.waitForConnections,
  connectionLimit: config.database.connectionLimit,
  queueLimit: config.database.queueLimit,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export default pool;

