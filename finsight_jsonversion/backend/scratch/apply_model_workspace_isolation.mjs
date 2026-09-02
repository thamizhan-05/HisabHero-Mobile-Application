import fs from 'fs';
import path from 'path';

const modelsDir = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/models');

const modelsToUpdate = [
  'Bill.js',
  'Contact.js',
  'InventoryItem.js',
  'Payroll.js',
  'FixedAsset.js',
  'PurchaseOrder.js',
  'Quote.js',
  'Document.js',
  'Upload.js',
  'AuditLog.js',
  'BankTransaction.js',
  'FinancialGoal.js',
  'RecurringSubscription.js'
];

for (const modelFile of modelsToUpdate) {
  const filePath = path.join(modelsDir, modelFile);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // If workspaceId is not present in schema fields
  if (!content.includes('workspaceId:')) {
    // Add workspaceId right after Schema({
    content = content.replace(/new mongoose\.Schema\(\s*\{/, `new mongoose.Schema({\n  workspaceId: { type: String, ref: 'Workspace', index: true },\n  workspaceType: { type: String, enum: ['personal', 'business'] },`);
    
    // Add compound index before export default
    const modelName = modelFile.replace('.js', '');
    const schemaNameMatch = content.match(/const\s+(\w+Schema)\s*=/);
    if (schemaNameMatch) {
      const schemaName = schemaNameMatch[1];
      const indexStr = `\n${schemaName}.index({ workspaceId: 1, createdAt: -1 });\n`;
      content = content.replace(`export default mongoose.model(`, `${indexStr}export default mongoose.model(`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${modelFile} with workspaceId & indexes.`);
  }
}

console.log('Successfully completed model workspace isolation updates.');
