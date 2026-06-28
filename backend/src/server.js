const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const client = require('prom-client');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// ----------------------------------------------------
// Prometheus Metrics
// ----------------------------------------------------

const register = new client.Registry();

client.collectDefaultMetrics({
  register
});

const httpRequestsTotal = new client.Counter({
  name: 'fintrust_http_requests_total',
  help: 'Total HTTP Requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'fintrust_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('combined'));

app.use((req, res, next) => {

  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {

    httpRequestsTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status: res.statusCode
    });

    end({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status: res.statusCode
    });

  });

  next();

});

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'fintrustuser',
  password: process.env.DB_PASSWORD || 'fintrustpassword',
  database: process.env.DB_NAME || 'fintrust',
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY,
      customer_name VARCHAR(100) NOT NULL,
      account_number VARCHAR(20) UNIQUE NOT NULL,
      balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY,
      account_id UUID REFERENCES accounts(id),
      type VARCHAR(20) NOT NULL,
      amount NUMERIC(15, 2) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const existing = await pool.query('SELECT COUNT(*) FROM accounts');
  if (Number(existing.rows[0].count) === 0) {
    const accountId = uuidv4();
    await pool.query(
      'INSERT INTO accounts (id, customer_name, account_number, balance) VALUES ($1, $2, $3, $4)',
      [accountId, 'Amina Bello', 'FTB-100001', 250000]
    );
    await pool.query(
      'INSERT INTO transactions (id, account_id, type, amount, description) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), accountId, 'CREDIT', 250000, 'Initial demo deposit']
    );
  }
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'UP',
      service: 'fintrust-bank-api',
      database: 'UP',
      time: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: 'DOWN', service: 'fintrust-bank-api', database: 'DOWN' });
  }
});

app.get('/metrics', async (req, res) => {

  res.set('Content-Type', register.contentType);

  res.end(await register.metrics());

});

app.get('/api/accounts', async (req, res) => {
  const result = await pool.query('SELECT * FROM accounts ORDER BY created_at DESC');
  res.json(result.rows);
});

app.post('/api/accounts', async (req, res) => {
  const { customerName, openingBalance = 0 } = req.body;
  if (!customerName) return res.status(400).json({ message: 'customerName is required' });

  const id = uuidv4();
  const accountNumber = `FTB-${Math.floor(100000 + Math.random() * 900000)}`;
  const result = await pool.query(
    'INSERT INTO accounts (id, customer_name, account_number, balance) VALUES ($1, $2, $3, $4) RETURNING *',
    [id, customerName, accountNumber, openingBalance]
  );

  if (Number(openingBalance) > 0) {
    await pool.query(
      'INSERT INTO transactions (id, account_id, type, amount, description) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), id, 'CREDIT', openingBalance, 'Opening balance']
    );
  }

  res.status(201).json(result.rows[0]);
});

app.post('/api/accounts/:id/deposit', async (req, res) => {
  const { amount, description = 'Customer deposit' } = req.body;
  if (!amount || Number(amount) <= 0)
    return res.status(400).json({ message: 'Valid amount is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const account = await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2 RETURNING *',
      [amount, req.params.id]
    );
    if (account.rowCount === 0) throw new Error('Account not found');
    await client.query(
      'INSERT INTO transactions (id, account_id, type, amount, description) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), req.params.id, 'CREDIT', amount, description]
    );
    await client.query('COMMIT');
    res.json(account.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(404).json({ message: error.message });
  } finally {
    client.release();
  }
});

app.post('/api/accounts/:id/withdraw', async (req, res) => {
  const { amount, description = 'Customer withdrawal' } = req.body;
  if (!amount || Number(amount) <= 0)
    return res.status(400).json({ message: 'Valid amount is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT balance FROM accounts WHERE id = $1', [
      req.params.id,
    ]);
    if (current.rowCount === 0) throw new Error('Account not found');
    if (Number(current.rows[0].balance) < Number(amount)) throw new Error('Insufficient balance');

    const account = await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2 RETURNING *',
      [amount, req.params.id]
    );
    await client.query(
      'INSERT INTO transactions (id, account_id, type, amount, description) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), req.params.id, 'DEBIT', amount, description]
    );
    await client.query('COMMIT');
    res.json(account.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/transactions', async (req, res) => {
  const result = await pool.query(`
    SELECT t.*, a.customer_name, a.account_number
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    ORDER BY t.created_at DESC
    LIMIT 50
  `);
  res.json(result.rows);
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

initDb()
  .then(() => app.listen(port, () => console.log(`FinTrust Bank API running on port ${port}`)))
  .catch((error) => {
    console.error('Failed to start application', error);
    throw error;
  });
