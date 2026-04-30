import { Router } from 'express';
import { SimulationController } from '../controllers/SimulationController.js';

const router = Router();

router.get('/:id', SimulationController.showSimulation);

export default router;
