const { Router } = require('express');
const { ApiController } = require('../controllers/ApiController.js');

const router = Router();

router.get('/dawa/autocomplete', ApiController.dawaAutocomplete);
router.get('/bbr/:adgangsadresseId', ApiController.bbrLookup);

module.exports = router;
