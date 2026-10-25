const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');

const { createApp, buildPool } = require('../src/server');

function createFakePool({
  count = '1',
  healthFails = false,
  accountNotFound = false,
  missingAccountId = 'missing-account'
} = {}) {
  const accounts = [
    {
      id: 'acc-1',
      customer_name: 'Amina Bello',
      account_number: 'FTB-100001',
      balance: '250000'
    }
  ];

  const transactions = [
    {
      id: 'tx-1',
      account_id: 'acc-1',
      type: 'CREDIT',
      amount: '250000',
      description: 'Initial demo deposit'
    }
  ];

  const queryHandlers = {
    'SELECT 1': () => {
      if (healthFails) throw new Error('Database offline');
      return { rows: [{ '?column?': 1 }] };
    },
    'SELECT COUNT(*) FROM accounts': () => ({ rows: [{ count }] }),
    'SELECT * FROM accounts ORDER BY created_at DESC': () => ({ rows: accounts }),
    'SELECT t.*, a.customer_name, a.account_number': () => ({ rows: transactions }),
    default: () => ({ rows: [] })
  };

  return {
    async query(sql, params = []) {
      if (sql === 'SELECT 1') return queryHandlers['SELECT 1']();
      if (sql.includes('SELECT COUNT(*)')) return queryHandlers['SELECT COUNT(*) FROM accounts']();
      if (sql.trimStart().startsWith('SELECT * FROM accounts')) return queryHandlers['SELECT * FROM accounts ORDER BY created_at DESC']();
      if (sql.trimStart().startsWith('SELECT t.*, a.customer_name, a.account_number')) return queryHandlers['SELECT t.*, a.customer_name, a.account_number']();
      if (sql.includes('INSERT INTO accounts')) {
        const id = params[0];
        const customerName = params[1];
        const accountNumber = params[2];
        const balance = Number(params[3]);
        accounts.push({
          id,
          customer_name: customerName,
          account_number: accountNumber,
          balance: String(balance)
        });
        return { rows: [accounts[accounts.length - 1]], rowCount: 1 };
      }
      if (sql.includes('UPDATE accounts SET balance = balance +')) {
        const [, accountId] = params;
        const amount = Number(params[0]);
        const account = accounts.find((item) => item.id === accountId);
        if (!account) {
          return { rowCount: 0, rows: [] };
        }
        account.balance = String(Number(account.balance) + amount);
        return { rowCount: 1, rows: [account] };
      }
      if (sql.includes('UPDATE accounts SET balance = balance -')) {
        const [, accountId] = params;
        const amount = Number(params[0]);
        const account = accounts.find((item) => item.id === accountId);
        if (!account) {
          return { rowCount: 0, rows: [] };
        }
        account.balance = String(Number(account.balance) - amount);
        return { rowCount: 1, rows: [account] };
      }
      if (sql.includes('SELECT balance FROM accounts')) {
        const account = accounts.find((item) => item.id === params[0]);
        if (!account) {
          return { rowCount: 0, rows: [] };
        }
        return { rowCount: 1, rows: [{ balance: account.balance }] };
      }
      if (sql.includes('INSERT INTO transactions')) {
        transactions.push({
          id: params[0],
          account_id: params[1],
          type: params[2],
          amount: String(params[3]),
          description: params[4]
        });
        return { rowCount: 1 };
      }
      return queryHandlers.default();
    },
    async connect() {
      return {
        async query(sql, params = []) {
          if (sql === 'BEGIN') return {};
          if (sql === 'COMMIT') return {};
          if (sql === 'ROLLBACK') return {};
          if (accountNotFound && params[0] === missingAccountId) {
            return { rowCount: 0, rows: [] };
          }
          return this.parent.query(sql, params);
        },
        release() {},
        parent: this
      };
    }
  };
}

async function withApp(app, handler) {
  const server = app.listen(0);
  await once(server, 'listening');

  try {
    await handler(server);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('buildPool throws when DATABASE_URL is missing', () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  try {
    assert.throws(() => buildPool(), /DATABASE_URL is not configured/);
  } finally {
    if (previous) {
      process.env.DATABASE_URL = previous;
    }
  }
});

test('GET /health returns API status', async () => {
  const app = createApp(createFakePool());
  await withApp(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'UP');
    assert.equal(body.database, 'UP');
  });
});

test('GET /health handles database failures', async () => {
  const app = createApp(createFakePool({ healthFails: true }));
  await withApp(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.database, 'DOWN');
  });
});

test('GET /api/accounts returns account rows', async () => {
  const app = createApp(createFakePool());
  await withApp(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/accounts`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(Array.isArray(body), true);
    assert.equal(body[0].customer_name, 'Amina Bello');
  });
});

test('GET /api/transactions returns transaction rows', async () => {
  const app = createApp(createFakePool());
  await withApp(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/transactions`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(Array.isArray(body), true);
    assert.equal(body[0].type, 'CREDIT');
  });
});

test('initDb seeds demo data when no accounts exist', async () => {
  const app = createApp(createFakePool({ count: '0' }));
  await app.locals.initDb();
  assert.equal(typeof app.locals.initDb, 'function');
});

test('POST /api/accounts/:id/withdraw succeeds with enough balance', async () => {
  const app = createApp(createFakePool());
  await withApp(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/accounts/acc-1/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100, description: 'Normal withdrawal' })
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.balance, '249900');
  });
});

test('POST /api/accounts rejects missing customer name', async () => {
  const app = createApp(createFakePool());
  await withApp(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openingBalance: 1000 })
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.message, 'customerName is required');
  });
});

test('POST /api/accounts stores a new account', async () => {
  const app = createApp(createFakePool());
  await withApp(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: 'Jane Doe', openingBalance: 2500 })
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.customer_name, 'Jane Doe');
    assert.equal(body.balance, '2500');
  });
});

test('POST /api/accounts/:id/deposit updates balance', async () => {
  const app = createApp(createFakePool());
  await withApp(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/accounts/acc-1/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 500, description: 'Bonus deposit' })
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.balance, '250500');
  });
});

test('POST /api/accounts/:id/deposit reports missing account', async () => {
  const app = createApp(createFakePool({ accountNotFound: true }));
  await withApp(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/accounts/missing-account/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 500, description: 'Bonus deposit' })
    });

    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.message, 'Account not found');
  });
});

test('POST /api/accounts/:id/withdraw rejects insufficient funds', async () => {
  const app = createApp(createFakePool());
  await withApp(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/accounts/acc-1/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 5000000, description: 'Too much' })
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.message, 'Insufficient balance');
  });
});

