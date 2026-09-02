import mongoose from 'mongoose';
import 'dotenv/config';

import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

async function heal() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);

  console.log('Starting Workspace & Identity Integrity Audit...');

  // 1. Audit Users
  const users = await User.find({});
  console.log(`Found ${users.length} user records.`);

  for (const user of users) {
    const userId = user._id.toString();
    console.log(`\nAuditing user: ${user.email} (${userId}, name: ${user.fullName})`);

    // Check personal workspace
    let personalWs = await Workspace.findOne({ ownerId: userId, type: 'personal', deletedAt: null });
    if (!personalWs) {
      console.log(`-> Creating missing Personal Workspace for ${user.email}`);
      personalWs = await new Workspace({
        name: user.fullName ? `${user.fullName}'s Personal Finance` : 'My Personal Finance',
        type: 'personal',
        isDefault: true,
        ownerId: userId
      }).save();
    }

    // Ensure WorkspaceMember for personal workspace
    let personalMember = await WorkspaceMember.findOne({ workspaceId: personalWs._id.toString(), userId });
    if (!personalMember) {
      console.log(`-> Creating missing WorkspaceMember record for Personal Workspace ${personalWs._id}`);
      await new WorkspaceMember({
        workspaceId: personalWs._id.toString(),
        userId,
        role: 'owner',
        status: 'active'
      }).save();
    }

    // Check all workspaces owned by this user
    const ownedWorkspaces = await Workspace.find({ ownerId: userId, deletedAt: null });
    for (const ws of ownedWorkspaces) {
      const wsId = ws._id.toString();
      const member = await WorkspaceMember.findOne({ workspaceId: wsId, userId });
      if (!member) {
        console.log(`-> Creating missing owner WorkspaceMember record for workspace "${ws.name}" (${wsId})`);
        await new WorkspaceMember({
          workspaceId: wsId,
          userId,
          role: 'owner',
          status: 'active'
        }).save();
      }
    }
  }

  console.log('\n✅ Workspace & Identity Integrity Audit Complete!');
  await mongoose.disconnect();
}

heal().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
