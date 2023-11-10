const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Product, Tag, ProductTag, Admin } = require('../models/index');

router.get('/', async function (req, res, next) {
  const productToShow = 5;
  const page = req.query.page || 1;
  const order = req.query.order || 'ASC';
  const search = req.query.search;
  const category = req.query.category;
  const offset = (page - 1) * productToShow;

  let whereClauses = {};

  if (search) {
    whereClauses.name = { [Op.like]: `%${search}%` };
  }

  if (category) {
    whereClauses.category = { [Op.like]: `%${category}%` };
  }

  // Ajoute une condition pour exclure les produits avec un stock de 0
  whereClauses.stock = { [Op.gt]: 0 };

  try {
    const { count: totalProducts, rows: products } = await Product.findAndCountAll({
      where: { ...whereClauses },
      attributes: ['title', 'price'],
      order: [['price', order]],
      limit: productToShow,
      offset: offset,
      include: [
        {
          model: Tag,
          attributes: ['name'],
          through: { attributes: [] }
        }
      ]
    });

    const hasPrev = page > 1;
    const hasNext = (page - 1) * productToShow + products.length < totalProducts;

    res.json({
      products,
      pagination: {
        count: totalProducts / 2,
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


module.exports = router;
