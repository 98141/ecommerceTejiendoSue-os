const express = require('express');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  updateOrder,
  cancelOrder,
  getAllOrderIds

} = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, createOrder); // Crear pedido
router.get('/my', verifyToken, getMyOrders); // Ver mis pedidos
router.get('/', verifyToken, isAdmin, getAllOrders); // Admin: ver todos
router.put("/orders/:id", verifyToken, isAdmin, updateOrder); // Admin: actualizar pedido
router.put('/:id', verifyToken, isAdmin, updateOrderStatus); // Admin: cambiar estado
router.get("/:id", verifyToken, isAdmin, getOrderById); // Admin: ver detalle de pedido por ID

router.put("/cancel/:id", verifyToken, isAdmin, cancelOrder); // Admin: cancelar pedido
router.get("/ids/all", verifyToken, isAdmin, getAllOrderIds);

module.exports = router;
