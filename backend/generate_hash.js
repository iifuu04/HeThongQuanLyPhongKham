/**
 * Script to generate bcrypt hash for demo password
 * Run: node generate_hash.js
 */

import bcrypt from 'bcrypt';

async function generateHash() {
    const password = '123456';
    const saltRounds = 10;

    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Bcrypt Hash:', hash);
    console.log('');

    // Verify the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash verification:', isValid ? 'VALID' : 'INVALID');
}

generateHash().catch(console.error);
