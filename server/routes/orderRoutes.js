const express = require('express');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, createOrder); // Crear pedido
router.get('/my', verifyToken, getMyOrders); // Ver mis pedidos
router.get('/', verifyToken, isAdmin, getAllOrders); // Admin: ver todos
router.put('/:id', verifyToken, isAdmin, updateOrderStatus); // Admin: cambiar estado

module.exports = router;
