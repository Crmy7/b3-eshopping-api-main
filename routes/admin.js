const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Product, Tag, ProductTag, Admin, Customer } = require('../models/index');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function generateToken(id, role) {
    return jwt.sign({ id: id, role: role }, process.env.JWT_SECRET, { expiresIn: '1d' });
}


const middlewares = require('../middlewares');

// router.use(['/createProduct', '/createTag', '/edit/:id', '/delete/:id'], middlewares.authentificationMiddleware);
router.use(['/all-accounts', '/add-admin'], middlewares.authentificationMiddlewareAdmin);



router.get('/', async function (req, res, next) {
    const admins = await Admin.findAll();
    res.json(admins);
});

router.post('/add-admin', async function (req, res, next) {
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
        const admin = await Admin.create({
            email: body.email,
            password: hashedPassword,
            display_name: body.display_name
        });
        res.status(201);
        res.json(admin).send("Utilisateur créé");
        
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
        const admin = await Admin.findOne({
            where: {
                email: body.email
            }
        });

        if (!admin) {
            res.status(400);
            res.send("Invalid password or email");
            return;
        }

        const isOk = await bcrypt.compare(body.password, admin.password);

        if (!isOk) {
            res.status(400);
            res.send("Invalid password or email");
            return;
        }

        delete admin.password;

        // Vérifie le rôle et générez un JWT Token
        const role = 'admin';
        return res.json({
            'token': generateToken(admin.id, role),
            'admin': admin,
        });
    } catch (exception) {
        res.status(500);
        res.send("Erreur lors de la connexion : " + exception);
    }
});

router.get('/all-accounts', async function (req, res, next) {
    try {
        const customers = await Customer.findAll();
        const admins = await Admin.findAll();
        
        res.json({
            customers: customers,
            admins: admins
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;
