const sequelize = require('./_database');

const Product = require('./Product');
const Tag = require('./Tag');
const ProductTag = require('./ProductTag');
const Admin = require('./Admin');
const Customer = require('./Customer');
const Cart = require('./Cart');
const Order = require('./Order');
const CartItem = require('./CartItem');

Admin.hasMany(Product);
Customer.hasMany(Product);
Product.belongsToMany(Tag, { through: 'ProductTag' });
Tag.belongsToMany(Product, { through: 'ProductTag' });

Customer.hasOne(Cart);
Cart.belongsTo(Customer);


Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });

Customer.hasMany(Order);
Order.belongsTo(Customer);
Order.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Order, { through: CartItem });

// Synchronisation de la base
sequelize.sync();

module.exports = {
    Product: Product,
    Tag: Tag,
    ProductTag: ProductTag,
    Admin: Admin,
    Customer: Customer,
    Cart: Cart,
    Order: Order,
    CartItem: CartItem,
}
