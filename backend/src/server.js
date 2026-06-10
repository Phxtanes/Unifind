require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

const authRoutes = require('./routes/authRoutes');
const lostItemRoutes = require('./routes/lostItemRoutes');
const lineRoutes = require('./routes/lineRoutes');
const claimRoutes = require('./routes/claimRoutes');

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
app.use('/api/line', lineRoutes);
app.use('/api/claims', claimRoutes);

const PORT = process.env.PORT || 9001;

// Seed default Administrator on startup if not present
const seedAdmin = async () => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (error) {
      console.error('⚠️ Error checking admin count in Supabase:', error.message);
      return;
    }

    if (count === 0) {
      const hashedPassword = await bcrypt.hash('admin1234', 8);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username: 'admin',
          email: 'admin@utcc.ac.th',
          password: hashedPassword,
          role: 'admin',
          is_approved: true,
          is_active: true
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
