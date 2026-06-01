const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const LostItem = sequelize.define('LostItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  place: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('stored', 'removed', 'deleted'),
    defaultValue: 'stored'
  },
  locker: {
    type: DataTypes.STRING,
    allowNull: true
  },
  finder_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  finder_phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  finder_studentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  finder_universityEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  picture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  namereport: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receiver: {
    type: DataTypes.STRING,
    allowNull: true
  },
  staffName: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Relationships
User.hasMany(LostItem, { foreignKey: 'user_id', as: 'recordedItems' });
LostItem.belongsTo(User, { foreignKey: 'user_id', as: 'recorder' });

module.exports = LostItem;
