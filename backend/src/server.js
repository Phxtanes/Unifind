require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');
const authRoutes = require('./routes/authRoutes');
const lostItemRoutes = require('./routes/lostItemRoutes');
const lineRoutes = require('./routes/lineRoutes');

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

const PORT = process.env.PORT || 9001;

// Sync database and seed default Administrator
sequelize.sync({ alter: true }).then(async () => {
  console.log('✅ Database synced successfully');
  
  try {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin1234', 8);
      await User.create({
        username: 'admin',
        email: 'admin@utcc.ac.th',
        password: hashedPassword,
        role: 'admin',
        isApproved: true,
        isActive: true
      });
      console.log('👑 Default Admin seeded successfully: admin / admin1234');
    }
  } catch (seedError) {
    console.error('⚠️ Seeding error:', seedError);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Unable to connect to the database:', err);
});
