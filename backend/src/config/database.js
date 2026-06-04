const { Sequelize } = require('sequelize');
require('dotenv').config();

// ปรับค่าเชื่อมต่อฐานข้อมูลใน Docker พอร์ต 3307 ให้สำเร็จรูป
const dbName = process.env.DB_NAME || 'lost_and_found';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || 'rootpassword';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 3307; 

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false
});

module.exports = sequelize;