import test from 'node:test';
import assert from 'node:assert/strict';
import { generateToken } from '../modules/auth/auth.service.js';

const BASE_URL = 'http://localhost:5000';
const testToken = generateToken('test_user_fix_1');

test('Feature Verification: Invoices & GST Compliance API', async (t) => {
  await t.test('POST /api/invoices creates a new GST invoice with tax breakdown', async () => {
    const res = await fetch(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
        'x-workspace-id': 'personal'
      },
      body: JSON.stringify({
        invoiceNumber: 'INV-2026-999',
        customerName: 'Bharat Electronics Ltd',
        customerGstin: '29ABCDE1234F1Z5',
        subtotal: 10000,
        cgst: 900,
        sgst: 900,
        igst: 0,
        taxRate: 18,
        totalTax: 1800,
        total: 11800,
        status: 'unpaid'
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.ok(body.invoice);
    assert.equal(body.invoice.invoiceNumber, 'INV-2026-999');
  });

  await t.test('GET /api/invoices returns wrapped invoices list', async () => {
    const res = await fetch(`${BASE_URL}/api/invoices`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'x-workspace-id': 'personal'
      }
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.invoices));
    assert.ok(body.invoices.some(i => i.invoiceNumber === 'INV-2026-999'));
  });
});

test('Feature Verification: Khata Book Digital Ledger', async (t) => {
  await t.test('POST /api/khata creates a ledger entry', async () => {
    const res = await fetch(`${BASE_URL}/api/khata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
        'x-workspace-id': 'personal'
      },
      body: JSON.stringify({
        partyName: 'Rajesh Hardware',
        phone: '9876543210',
        balance: 4500,
        partyType: 'customer'
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
  });

  await t.test('GET /api/khata returns envelope with ledgers array', async () => {
    const res = await fetch(`${BASE_URL}/api/khata`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'x-workspace-id': 'personal'
      }
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.ledgers));
    assert.ok(body.ledgers.length > 0);
  });
});

test('Feature Verification: Inventory & Fixed Assets', async (t) => {
  await t.test('POST /api/inventory adds stock item', async () => {
    const res = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
        'x-workspace-id': 'personal'
      },
      body: JSON.stringify({
        name: 'UltraTech Cement 50kg',
        type: 'stock',
        stockQuantity: 150,
        unitValue: 380,
        category: 'Raw Materials'
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
  });

  await t.test('GET /api/inventory returns envelope with items array', async () => {
    const res = await fetch(`${BASE_URL}/api/inventory`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'x-workspace-id': 'personal'
      }
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.items));
    assert.ok(body.items.some(i => i.name === 'UltraTech Cement 50kg'));
  });
});

test('Feature Verification: Voice Bookkeeper & AI Copilot', async (t) => {
  await t.test('POST /api/business/voice-copilot parses vernacular phrase and auto-commits', async () => {
    const res = await fetch(`${BASE_URL}/api/business/voice-copilot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
        'x-workspace-id': 'personal'
      },
      body: JSON.stringify({
        transcript: 'Spent ₹2,400 on petrol today',
        autoCommit: true
      })
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.parsed);
    assert.equal(body.parsed.amount, 2400);
    assert.ok(body.committed);
  });

  await t.test('POST /api/ai/chat returns deterministic expert financial reply', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
        'x-workspace-id': 'personal'
      },
      body: JSON.stringify({
        message: 'Can I afford to spend 50000 on new equipment?'
      })
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(typeof body.reply, 'string');
    assert.ok(body.reply.length > 10);
  });
});
