const sequelize = require('./_database');
const { DataTypes, Sequelize } = require('sequelize');

const OrderItem = sequelize.define('OrderItem', {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
});

module.exports = OrderItem;
