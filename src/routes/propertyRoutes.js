import { Router } from 'express';
import { PropertyController } from '../controllers/PropertyController.js';

const router = Router();

router.get('/', PropertyController.showHome);
router.post('/', PropertyController.createProperty);
router.get('/:id', PropertyController.showProperty);
router.post('/:id/delete', PropertyController.deleteProperty);

export default router;
