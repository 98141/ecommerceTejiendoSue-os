const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProducts);                       // Público
router.get('/:id', getProductById);                 // Público
router.post('/', verifyToken, isAdmin, createProduct);   // Admin
router.put('/:id', verifyToken, isAdmin, updateProduct); // Admin
router.delete('/:id', verifyToken, isAdmin, deleteProduct); // Admin

module.exports = router;
