const { Router } = require('express');
const { SimulationController } = require('../controllers/SimulationController.js');

const router = Router();

router.get('/:id', SimulationController.showSimulation);

module.exports = router;
