const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Product, Tag, ProductTag, Admin } = require('../models/index');

const middlewares = require('../middlewares');

// router.use(['/createProduct', '/createTag', '/edit/:id', '/delete/:id'], middlewares.authentificationMiddleware);
router.use(['/createProduct', '/createTag', '/edit/:id', '/delete/:id',], middlewares.authentificationMiddlewareAdmin);

router.get('/', async function (req, res, next) {
    const productToShow = 5;
    const page = req.query.page || 1;
    const search = req.query.search;
    const tag = req.query.tag;
    const order = req.query.order || 'ASC';
    const offset = (page - 1) * productToShow;

    let whereClauses = {};

    if (search) {
        whereClauses.title = { [Op.like]: `%${search}%` };
    }

    // Ajoute une condition pour exclure les produits avec un stock de 0
    whereClauses.stock = { [Op.gt]: 0 };

    // Récupére tous les tags
    const allTags = await Tag.findAll({ attributes: ['name'] });

    let includeClauses = [
        {
            model: Tag,
            attributes: ['name'],
            through: { attributes: [] }
        }
    ];

    if (tag) {
        // Ajoute la condition de filtre de tag seulement si le tag est spécifié
        includeClauses.push({
            model: Tag,
            attributes: ['name'],
            through: { attributes: [] },
            where: { name: { [Op.like]: `%${tag}%` } }
        });
    }

    try {
        const { count: totalProducts, rows: products } = await Product.findAndCountAll({
            where: { ...whereClauses },
            attributes: ['title', 'price'],
            order: [['price', order]],
            limit: productToShow,
            offset: offset,
            include: includeClauses
        });

        const hasPrev = page > 1;
        const hasNext = (page - 1) * productToShow + products.length < totalProducts;

        res.json({
            products,
            tags: allTags.map(tag => tag.name),
            pagination: {
                count: totalProducts,
                page,
                productToShow,
                offset,
                hasPrev,
                hasNext,
            },
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



router.get('/:id', async function (req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id, {
            attributes: ['title', 'description', 'price', 'stock'], // Sélectionnez les attributs que vous souhaitez
            include: [{ model: Tag, attributes: ['name'], through: { attributes: [] } }],
        });

        if (!product) {
            res.status(404).json({ error: 'Produit non trouvé' });
            return;
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Route pour créer des produits avec des tags existants
router.post('/createProduct', async (req, res) => {
    try {
        const { title, price, stock, description, tags } = req.body;

        // Vérifiez si tous les tags existent
        const existingTags = await Tag.findAll({
            where: { name: tags },
        });

        // Si la longueur des tags existants n'est pas égale à la longueur des tags fournis, alors au moins un tag n'existe pas
        if (existingTags.length !== tags.length) {
            res.status(400).json({ error: 'Certains tags n\'existent pas.' });
            return;
        }

        const product = await Product.create({
            title,
            price,
            stock,
            description,
        });

        // Associez les tags existants au produit
        await product.addTags(existingTags);

        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la création du produit.' });
    }
});


router.post('/createTag', async (req, res) => {
    try {
        const { name } = req.body;

        const tag = await Tag.create({
            name,
        });

        res.json(tag);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la création du tag.' });
    }
});

router.patch('/edit/:id', async (req, res) => {
    try {
        const { title, price, stock, description, tags } = req.body;

        // Vérifie si le produit existe
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Tag, attributes: ['id'], through: { attributes: [] } }]
        });

        if (!product) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }

        // Mettre à jour les propriétés du produit seulement si elles sont fournies
        if (title) product.title = title;
        if (price) product.price = price;
        if (stock) product.stock = stock;
        if (description) product.description = description;

        // Enregistre les modifications
        await product.save();

        // Mettre à jour les tags du produit
        if (tags) {
            const existingTags = await Tag.findAll({
                where: { name: tags },
            });

            // Supprimer les associations de tags existantes
            await product.removeTags(existingTags);

            // Ajouter les nouveaux tags
            await product.addTags(existingTags);
        }

        return res.json(product);
    } catch (error) {
        // Gérer des erreurs
        console.error(error);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du produit.' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        // Vérifie si le produit existe
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }

        // Supprime le produit
        await product.destroy();

        return res.json({ message: 'Produit supprimé avec succès.' });
    } catch (error) {
        // Gérer des erreurs
        console.error(error);
        return res.status(500).json({ error: 'Erreur lors de la suppression du produit.' });
    }
});

module.exports = router;