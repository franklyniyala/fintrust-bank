import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [status, setStatus] = useState('Checking...');

  async function loadData() {
    const [accountRes, transactionRes, healthRes] = await Promise.all([
      fetch(`${API_URL}/api/accounts`),
      fetch(`${API_URL}/api/transactions`),
      fetch(`${API_URL}/health`),
    ]);
    setAccounts(await accountRes.json());
    setTransactions(await transactionRes.json());
    const health = await healthRes.json();
    setStatus(`${health.status} | Database: ${health.database}`);
  }

  async function createAccount(e) {
    e.preventDefault();
    await fetch(`${API_URL}/api/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, openingBalance: Number(openingBalance) }),
    });
    setCustomerName('');
    setOpeningBalance(10000);
    loadData();
  }

  async function deposit(accountId) {
    await fetch(`${API_URL}/api/accounts/${accountId}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 5000, description: 'Demo deposit from portal' }),
    });
    loadData();
  }

  async function withdraw(accountId) {
    await fetch(`${API_URL}/api/accounts/${accountId}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 2500, description: 'Demo withdrawal from portal' }),
    });
    loadData();
  }

  useEffect(() => {
    loadData().catch(() => setStatus('API unavailable'));
  }, []);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">FinTrust Bank</p>
          <h1>Digital Banking Operations Portal</h1>
        </div>
        <div className="status">
          Service Status: <strong>{status}</strong>
        </div>
      </section>

      <section className="card">
        <h2>Create Account</h2>
        <form onSubmit={createAccount}>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name"
            required
          />
          <input
            type="number"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="Opening balance"
          />
          <button>Create Account</button>
        </form>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Accounts</h2>
          {accounts.map((account) => (
            <div className="row" key={account.id}>
              <div>
                <strong>{account.customer_name}</strong>
                <span>{account.account_number}</span>
              </div>
              <div className="actions">
                <strong>₦{Number(account.balance).toLocaleString()}</strong>
                <button onClick={() => deposit(account.id)}>Deposit</button>
                <button onClick={() => withdraw(account.id)}>Withdraw</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Recent Transactions</h2>
          {transactions.map((tx) => (
            <div className="row" key={tx.id}>
              <div>
                <strong>{tx.type}</strong>
                <span>
                  {tx.customer_name} | {tx.description}
                </span>
              </div>
              <strong>₦{Number(tx.amount).toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
