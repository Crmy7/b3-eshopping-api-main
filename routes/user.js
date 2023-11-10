const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Product, Tag, ProductTag, Admin, Customer } = require('../models/index');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function generateToken(id, role) {
    return jwt.sign({ id: id, role: role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}


router.post('/signup', async function (req, res, next) {
    const body = req.body;

    if (!body.email || !body.password || !body.display_name) {
        res.status(400)
        res.send("Tous les champs sont obligatoires")
        return
    }

    if (body.password.length < 8) {
        res.status(400)
        res.send("MDP doit avoir au moins 8 symboles")
        return
    }

    try {
        const hashedPassword = await bcrypt.hash(body.password, 12);
        const customer = await Customer.create({
            email: body.email,
            password: hashedPassword,
            display_name: body.display_name
        });
        res.status(201);
        res.json(customer).send("Utilisateur créé");
        
    } catch (exception) {
        res.status(500)
        res.send("Erreur lors de la création : " + exception)
    }
});

router.post('/login', async function (req, res, next) {
    const body = req.body;

    if (!body.email || !body.password) {
        res.status(400);
        res.send("Tous les champs sont obligatoires");
        return;
    }

    try {
        const customer = await Customer.findOne({
            where: {
                email: body.email
            }
        });

        if (!customer) {
            res.status(400);
            res.send("Invalid password or email");
            return;
        }

        const isOk = await bcrypt.compare(body.password, customer.password);

        if (!isOk) {
            res.status(400);
            res.send("Invalid password or email");
            return;
        }

        delete customer.password;

        // Vérifiez le rôle et générez un JWT Token
        const role = 'customer';
        return res.json({
            'token': generateToken(customer.id, role),
            'customer': customer,
        });
    } catch (exception) {
        res.status(500);
        res.send("Erreur lors de la connexion : " + exception);
    }
});

module.exports = router;