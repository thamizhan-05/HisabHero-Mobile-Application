import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { usersRepo, workspacesRepo, transactionsRepo, invoicesRepo, khataRepo, inventoryRepo, staffRepo } from '../db/supabaseDb.js';
import { generateToken } from '../modules/auth/auth.service.js';

function mockRequest(app, method, url, { headers = {}, body = null } = {}) {
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      headers: { 'content-type': 'application/json', ...headers },
      body: body || {},
      ip: '127.0.0.1'
    };

    let statusCode = 200;
    let resHeaders = {};

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      setHeader(k, v) {
        resHeaders[k] = v;
      },
      json(data) {
        resolve({ status: statusCode, headers: resHeaders, body: data });
      },
      send(data) {
        resolve({ status: statusCode, headers: resHeaders, body: data });
      }
    };

    app.handle(req, res);
  });
}

test('Supabase Migration: Pure Supabase Data Access Layer Operations', async (t) => {
  // Test User Creation & Retrieval
  await t.test('usersRepo creates and retrieves a user', async () => {
    const email = `test_migration_${Date.now()}@hisabhero.io`;
    const user = await usersRepo.create({
      email,
      fullName: 'Supabase User',
      password: 'SamplePassword123!',
      role: 'owner',
      accountType: 'personal'
    });

    assert.ok(user.id);
    assert.equal(user.email, email);

    const fetched = await usersRepo.findByEmail(email);
    assert.ok(fetched);
    assert.equal(fetched.id, user.id);
  });

  // Test Workspace Creation & Cross-Platform Sync
  await t.test('workspacesRepo creates personal & business workspaces linked to user', async () => {
    const user = await usersRepo.create({
      email: `sync_test_${Date.now()}@hisabhero.io`,
      fullName: 'Sync Tester',
      password: 'PassWord123!'
    });

    // 1. Create Personal Workspace
    const personalWs = await workspacesRepo.create({
      name: 'Tester Personal Vault',
      type: 'personal',
      ownerId: user.id
    });
    assert.ok(personalWs.id);
    assert.equal(personalWs.type, 'personal');

    // 2. Create Business Workspace
    const businessWs = await workspacesRepo.create({
      name: 'Tester Supermarket LLC',
      type: 'business',
      businessName: 'Tester Supermarket LLC',
      industry: 'Retail & Grocery',
      ownerId: user.id
    });
    assert.ok(businessWs.id);
    assert.equal(businessWs.type, 'business');

    // 3. User Workspaces Retrieval returns BOTH personal and business
    const userWorkspaces = await workspacesRepo.getUserWorkspaces(user.id);
    assert.ok(userWorkspaces.length >= 2);
    const hasPersonal = userWorkspaces.some(w => w.id === personalWs.id && w.type === 'personal');
    const hasBusiness = userWorkspaces.some(w => w.id === businessWs.id && w.type === 'business');
    assert.ok(hasPersonal, 'Personal workspace is present');
    assert.ok(hasBusiness, 'Business workspace is present');
  });

  // Test Transaction Ledger
  await t.test('transactionsRepo creates and lists workspace transactions', async () => {
    const ws = await workspacesRepo.create({
      name: 'TX Test Vault',
      type: 'personal'
    });

    const tx = await transactionsRepo.create({
      workspaceId: ws.id,
      type: 'expense',
      category: 'Utilities',
      amount: 1500,
      description: 'Electricity bill',
      merchant: 'State Electricity Board'
    });

    assert.ok(tx.id);
    assert.equal(tx.amount, 1500);

    const list = await transactionsRepo.findByWorkspace(ws.id);
    assert.ok(list.length >= 1);
    assert.ok(list.some(t => t.id === tx.id));
  });

  // Test Staff (Pagar Khata)
  await t.test('staffRepo creates and updates staff member', async () => {
    const ws = await workspacesRepo.create({
      name: 'Staff Test Vault',
      type: 'business'
    });

    const staff = await staffRepo.create({
      workspaceId: ws.id,
      name: 'Aakash Sharma',
      role: 'Store Manager',
      monthlySalary: 35000,
      phone: '9876543210'
    });

    assert.ok(staff.id);
    assert.equal(staff.name, 'Aakash Sharma');

    const staffList = await staffRepo.findByWorkspace(ws.id);
    assert.ok(staffList.some(s => s.id === staff.id));
  });
});

test('API Integration: Multi-Platform Workspace Sync via HTTP API', async (t) => {
  // Create user and token
  const email = `api_sync_${Date.now()}@hisabhero.io`;
  const user = await usersRepo.create({
    email,
    fullName: 'API Sync User',
    password: 'Password123!'
  });
  const token = generateToken(user.id);

  // 1. Create Business Workspace via POST /api/workspaces/business
  await t.test('POST /api/workspaces/business creates business workspace', async () => {
    const res = await mockRequest(app, 'POST', '/api/workspaces/business', {
      headers: { authorization: `Bearer ${token}` },
      body: { name: 'Metro Electronics', businessName: 'Metro Electronics', industry: 'Retail' }
    });

    assert.equal(res.status, 201);
    assert.ok(res.body.success);
    assert.equal(res.body.workspace.type, 'business');
  });

  // 2. Create Personal Workspace via POST /api/workspaces/personal
  await t.test('POST /api/workspaces/personal creates personal workspace', async () => {
    const res = await mockRequest(app, 'POST', '/api/workspaces/personal', {
      headers: { authorization: `Bearer ${token}` },
      body: { name: 'Personal Savings' }
    });

    assert.equal(res.status, 201);
    assert.ok(res.body.success);
    assert.equal(res.body.workspace.type, 'personal');
  });

  // 3. GET /api/workspaces lists both personal and business for mobile & web sync
  await t.test('GET /api/workspaces returns both workspaces for mobile/web synchronization', async () => {
    const res = await mockRequest(app, 'GET', '/api/workspaces', {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    const types = res.body.map(w => w.type);
    assert.ok(types.includes('business'));
    assert.ok(types.includes('personal'));
  });

  // 4. GET /api/auth/me returns segregated workspaces
  await t.test('GET /api/auth/me returns profile with segregated workspaces', async () => {
    const res = await mockRequest(app, 'GET', '/api/auth/me', {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.email, email);
    assert.ok(Array.isArray(res.body.personalWorkspaces));
    assert.ok(Array.isArray(res.body.businessWorkspaces));
    assert.ok(res.body.personalWorkspaces.length >= 1);
    assert.ok(res.body.businessWorkspaces.length >= 1);
  });
});
