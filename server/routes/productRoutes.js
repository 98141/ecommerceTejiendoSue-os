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

// Público
router.get('/', getProducts);                       
router.get('/:id', getProductById);                

// Admin
router.post('/', verifyToken, isAdmin, createProduct);   
router.put('/:id', verifyToken, isAdmin, updateProduct); 
router.delete('/:id', verifyToken, isAdmin, deleteProduct); 

module.exports = router;
