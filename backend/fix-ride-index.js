// Run this script ONCE to fix the geo index issue on the rides collection
// Usage: node fix-ride-index.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rapido';

async function fixIndex() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const ridesCollection = db.collection('rides');
    
    // List all indexes
    const indexes = await ridesCollection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Drop any 2dsphere indexes on rides collection
    for (const idx of indexes) {
      if (idx.name !== '_id_') {
        const has2d = Object.values(idx.key).includes('2dsphere');
        if (has2d) {
          console.log('Dropping 2dsphere index:', idx.name);
          await ridesCollection.dropIndex(idx.name);
          console.log('Dropped!');
        }
      }
    }
    
    console.log('Done! Remaining indexes:');
    const remaining = await ridesCollection.indexes();
    console.log(JSON.stringify(remaining, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixIndex();
