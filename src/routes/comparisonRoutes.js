import { Router } from 'express';
import { ComparisonController } from '../controllers/ComparisonController.js';

const router = Router();

router.get('/', ComparisonController.showComparison);

export default router;
