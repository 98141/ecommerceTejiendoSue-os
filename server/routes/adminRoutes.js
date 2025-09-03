const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

router.use(verifyToken, isAdmin);
router.get("/users", adminController.listUsers);

module.exports = router;
