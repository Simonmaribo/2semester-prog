import { Router } from 'express';
import { ApiController } from '../controllers/ApiController.js';

const router = Router();

router.get('/dawa/autocomplete', ApiController.dawaAutocomplete);
router.get('/bbr/:adgangsadresseId', ApiController.bbrLookup);

export default router;
