const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(191), // กำหนดความยาวที่เหมาะสมเพื่อป้องกันบั๊กขนาด Index บน MySQL บางเวอร์ชัน
    allowNull: false,
    unique: 'actions_unique_username' // ล็อกชื่อ Unique Key ไว้ ไม่ให้ Sequelize ไปเจนชื่อสุ่มวนลูปซ้ำซ้อน
  },
  email: {
    type: DataTypes.STRING(191), // กำหนดความยาวที่เหมาะสมสำหรับอีเมล
    allowNull: false,
    unique: 'actions_unique_email' // ล็อกชื่อ Unique Key ป้องกันการพ่นคำสั่ง ALTER TABLE ซ้ำซ้อนตอน nodemon รีสตาร์ท
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'staff', 'member'),
    defaultValue: 'member'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  // Option เพิ่มเติมเพื่อเพิ่มความปลอดภัยให้ระบบฐานข้อมูล
  timestamps: true, // ช่วยสร้าง createdAt และ updatedAt ให้อัตโนมัติ
});

module.exports = User;