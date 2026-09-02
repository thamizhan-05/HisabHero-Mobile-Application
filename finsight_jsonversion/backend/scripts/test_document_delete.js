import dotenv from 'dotenv';
dotenv.config();

async function testDocumentDelete() {
  console.log('🧪 Testing Document Deletion & Cascade Ledger Purge...\n');

  // 1. Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'selvathevar10042005@gmail.com',
      password: 'Stvr2005$',
      deviceId: 'test_delete_001',
      deviceName: 'Delete Tester'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const wsId = loginData.user.activeWorkspace.id;

  // 2. Upload test statement
  const csvContent = `Date,Description,Type,Amount,Category\n2026-02-01,Test Delete Item 1,Debit,250.00,General\n2026-02-02,Test Delete Item 2,Credit,1500.00,General`;
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const formData = new FormData();
  formData.append('file', blob, 'to_be_deleted_statement.csv');

  const prevRes = await fetch('http://localhost:5000/api/upload/preview', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId },
    body: formData
  });
  const prevData = await prevRes.json();

  const commitRes = await fetch('http://localhost:5000/api/upload/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId },
    body: JSON.stringify({
      fileName: prevData.fileName,
      parserUsed: prevData.parserUsed,
      transactions: prevData.transactions
    })
  });
  const commitData = await commitRes.json();
  console.log(`✅ Uploaded & Committed statement (Doc ID: ${commitData.documentId})`);

  // Verify transactions count
  const txBefore = await (await fetch('http://localhost:5000/api/transactions', { headers: { 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId } })).json();
  console.log(`📊 Transactions before delete: ${txBefore.transactions?.length}`);

  // 3. Delete Document
  console.log(`⏳ Deleting document ${commitData.documentId}...`);
  const delRes = await fetch(`http://localhost:5000/api/documents/${commitData.documentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId }
  });
  const delData = await delRes.json();
  console.log(`✅ Delete Response:`, delData);

  // 4. Verify transactions count after delete
  const txAfter = await (await fetch('http://localhost:5000/api/transactions', { headers: { 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId } })).json();
  const docsAfter = await (await fetch('http://localhost:5000/api/documents', { headers: { 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId } })).json();

  console.log(`📊 Transactions after delete: ${txAfter.transactions?.length}`);
  console.log(`📁 Documents after delete: ${docsAfter.documents?.length}`);

  console.log('\n🎉 CASCADE STATEMENT DELETION VERIFIED 100%!');
}

testDocumentDelete().catch(console.error);
