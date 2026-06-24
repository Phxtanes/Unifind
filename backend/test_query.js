const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const supabase = require('./src/config/supabase');
const bcrypt = require('bcryptjs');

async function test() {
  try {
    const hashedPassword = await bcrypt.hash('admin1234', 8);
    const { data, error } = await supabase
      .from('User')
      .update({ password_hash: hashedPassword })
      .eq('username', 'admin')
      .select();
    
    if (error) {
      console.error('Error updating admin password:', error.message);
    } else {
      console.log('Successfully updated admin password! Row details:', data);
    }
  } catch (err) {
    console.error(err);
  }
}

test();
