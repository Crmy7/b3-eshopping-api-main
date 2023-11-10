const sequelize = require('./_database');
const { DataTypes } = require('sequelize');

const CartItem = sequelize.define('CartItem', {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },

});


module.exports = CartItem;