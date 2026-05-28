// Fix user email index and check all indexes
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fixUserIndexes() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const users = db.collection('users');
  
  const indexes = await users.indexes();
  console.log('Current user indexes:');
  indexes.forEach(i => console.log(' -', i.name, JSON.stringify(i.key), 'sparse:', i.sparse, 'unique:', i.unique));
  
  // Fix the email index - drop it and recreate as sparse unique
  const emailIdx = indexes.find(i => i.name === 'email_1');
  if (emailIdx) {
    console.log('\nDropping email_1 index to recreate as sparse...');
    await users.dropIndex('email_1');
    await users.createIndex({ email: 1 }, { unique: true, sparse: true, background: true });
    console.log('Email index recreated as sparse unique!');
  }
  
  const finalIndexes = await users.indexes();
  console.log('\nFinal indexes:');
  finalIndexes.forEach(i => console.log(' -', i.name, JSON.stringify(i.key), 'sparse:', i.sparse));
  
  await mongoose.disconnect();
  console.log('Done!');
}

fixUserIndexes().catch(e => { console.error(e.message); process.exit(1); });
