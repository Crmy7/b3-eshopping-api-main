const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./models/_database');
const { Product, Tag, ProductTag, Admin, Customer } = require('./models/index');

async function authentificationMiddleware(req, res, next) {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        jwt.verify(token, secret, async (err, decoded) => {
            if (err) {
                console.log(err);
                return res.status(401).json({ message: 'Token invalide' });
            }

            const userId = decoded.id;
            const user = await Customer.findOne({ where: { id: userId } });

            if (!user) {
                res.status(400);
                res.send("Invalid password or email");
                return;
            }
            
            req.user = user;
            next();
        });
    } else {
        res.status(401);
        res.send('Pas connecté');
    }
}

async function authentificationMiddlewareAdmin(req, res, next) {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        jwt.verify(token, secret, async (err, decoded) => {
            if (err) {
                console.log(err);
                return res.status(401).json({ message: 'Token invalide' });
            }
            
            // Vérifiez le rôle dans le token
            if (decoded.role !== 'admin') {
                return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas un administrateur.' });
            }

            const adminId = decoded.id;
            const admin = await Admin.findOne({ where: { id: adminId } });
            
            if (!admin) {
                res.status(400);
                res.send("Invalid password or email");
                return;
            }

            req.admin = admin;
            next();
        });
    } else {
        res.status(401);
        res.send('Pas connecté');
    }
}

module.exports = {
    authentificationMiddleware: authentificationMiddleware,
    authentificationMiddlewareAdmin: authentificationMiddlewareAdmin
};
