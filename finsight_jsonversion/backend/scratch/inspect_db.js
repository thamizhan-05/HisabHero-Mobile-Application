import mongoose from 'mongoose';
import 'dotenv/config';

async function check() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  console.log('Connecting to Mongo...');
  await mongoose.connect(uri);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Found collections:', collections.length);
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`- ${c.name}: ${count} docs`);
  }

  // Let's inspect some users, workspaces, workspacemembers
  const users = await mongoose.connection.db.collection('users').find({}).limit(5).toArray();
  console.log('\nSample Users:', users.map(u => ({ id: u._id, email: u.email, fullName: u.fullName, defaultWorkspaceId: u.defaultWorkspaceId })));

  const workspaces = await mongoose.connection.db.collection('workspaces').find({}).limit(10).toArray();
  console.log('\nSample Workspaces:', workspaces.map(w => ({ id: w._id, name: w.name, type: w.type, ownerId: w.ownerId, joinCode: w.joinCode })));

  const workspaceMembers = await mongoose.connection.db.collection('workspacemembers').find({}).limit(10).toArray();
  console.log('\nSample Workspace Members:', workspaceMembers.map(m => ({ id: m._id, workspaceId: m.workspaceId, userId: m.userId, role: m.role, status: m.status })));

  await mongoose.disconnect();
}
check().catch(console.error);
