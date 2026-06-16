const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');
const authRoutes = require('./routes/authRoutes');
const lostItemRoutes = require('./routes/lostItemRoutes');
const foundItemRoutes = require('./routes/foundItemRoutes');
const lineRoutes = require('./routes/lineRoutes');
const claimRoutes = require('./routes/claimRoutes');
const masterDataRoutes = require('./routes/masterDataRoutes');

const app = express();

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lost-items', lostItemRoutes);
app.use('/api/found-items', foundItemRoutes);
app.use('/api/line', lineRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/master', masterDataRoutes);

const PORT = process.env.PORT || 9001;

// Seed default Administrator on startup if not present
const seedAdmin = async () => {
  try {
    const { count, error } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN');

    if (error) {
      console.error('⚠️ Error checking admin count in Supabase:', error.message);
      return;
    }

    if (count === 0) {
      const hashedPassword = await bcrypt.hash('admin1234', 8);
      const { error: insertError } = await supabase
        .from('User')
        .insert({
          username: 'admin',
          full_name: 'System Admin',
          email: 'admin@utcc.ac.th',
          password_hash: hashedPassword,
          role: 'ADMIN',
          status: 'Active'
        });

      if (insertError) {
        console.error('⚠️ Seeding admin error:', insertError.message);
      } else {
        console.log('👑 Default Admin seeded successfully in Supabase: admin / admin1234');
      }
    } else {
      console.log('✅ Admin user already exists in Supabase');
    }
  } catch (err) {
    console.error('⚠️ Unexpected seeding error:', err);
  }
};

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  await seedAdmin();
});
