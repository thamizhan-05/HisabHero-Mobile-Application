import dotenv from 'dotenv';
dotenv.config();

async function testFastDelete() {
  console.log('🧪 Testing Fast Document Delete via API...\n');

  // 1. Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'selvathevar10042005@gmail.com',
      password: 'Stvr2005$',
      deviceId: 'del_test_dev',
      deviceName: 'Delete Tester'
    })
  });
  const { token, user } = await loginRes.json();
  const wsId = user.activeWorkspace.id;

  // 2. Fetch documents
  const docsRes = await fetch('http://localhost:5000/api/documents', {
    headers: { 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId }
  });
  const { documents } = await docsRes.json();
  console.log(`📑 Found ${documents?.length || 0} documents in workspace.`);

  if (!documents || documents.length === 0) {
    console.log('No document to delete. Workspace is clean.');
    return;
  }

  const targetDoc = documents[0];
  console.log(`⏳ Deleting document "${targetDoc.fileName}" (ID: ${targetDoc.id})...`);

  const startTime = Date.now();
  const delRes = await fetch(`http://localhost:5000/api/documents/${targetDoc.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId }
  });
  const delData = await delRes.json();
  const elapsed = Date.now() - startTime;

  console.log(`⚡ Deletion completed in ${elapsed}ms:`, delData);

  if (delRes.ok && delData.success) {
    console.log('\n🎉 SUCCESS: Document and associated transactions deleted in milliseconds without hanging!');
  } else {
    throw new Error('Delete failed');
  }
}

testFastDelete().catch(console.error);
