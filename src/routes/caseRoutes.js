import { Router } from 'express';
import { CaseController } from '../controllers/CaseController.js';

const router = Router();

router.post('/', CaseController.createCase);
router.get('/:id', CaseController.showCase);
router.post('/:id/delete', CaseController.deleteCase);
router.post('/:id/duplicate', CaseController.duplicateCase);

router.post('/:id/purchase', CaseController.savePurchaseData);
router.post('/:id/financing', CaseController.saveFinancingData);
router.post('/:id/operating-and-rental', CaseController.saveOperatingAndRental);
router.post('/:id/renovations', CaseController.saveRenovationsData);

export default router;
