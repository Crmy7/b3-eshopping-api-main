const sequelize = require('./_database');
const { DataTypes, Sequelize } = require('sequelize');

const Customer = sequelize.define('Customer', {
    email: {
        type: DataTypes.STRING,
    },
    password: {
        type: DataTypes.STRING,
    },
    display_name: {
        type: DataTypes.STRING,
    },
}, {
    indexes: [
        { unique: true, fields: ['email'] },
    ]
});

module.exports = Customer;