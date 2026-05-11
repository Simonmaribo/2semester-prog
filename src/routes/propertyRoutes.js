const { Router } = require('express');
const { PropertyController } = require('../controllers/PropertyController.js');

const router = Router();

router.get('/', PropertyController.showHome);
router.post('/', PropertyController.createProperty);
router.get('/:id', PropertyController.showProperty);
router.post('/:id/delete', PropertyController.deleteProperty);

module.exports = router;
