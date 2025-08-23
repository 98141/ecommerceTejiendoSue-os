const express = require('express');
const router = express.Router();
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  mergeCart,
} = require('../controllers/cartController');

const { verifyToken } = require("../middleware/auth");

router.get('/', verifyToken, getCart);
router.post('/items', verifyToken, addItem);
router.patch('/items', verifyToken, updateItem);
router.delete('/items', verifyToken, removeItem);
router.post('/merge', verifyToken, mergeCart);

module.exports = router;