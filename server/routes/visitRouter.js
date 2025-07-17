const express = require("express");
const router = express.Router();
const { incrementVisit, getVisits } = require("../controllers/visitController");

router.post("/increment", incrementVisit); 
router.get("/count", getVisits);           

module.exports = router;
