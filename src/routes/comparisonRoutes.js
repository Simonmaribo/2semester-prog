const { Router } = require('express');
const { ComparisonController } = require('../controllers/ComparisonController.js');

const router = Router();

router.get('/', ComparisonController.showComparison);

module.exports = router;
