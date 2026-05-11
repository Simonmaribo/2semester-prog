const { DawaService } = require('../services/DawaService.js');
const { BbrService } = require('../services/BbrService.js');

class ApiController {
  static async dawaAutocomplete(req, res) {
    try {
      const query = req.query.q;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const results = await DawaService.autocomplete(query);
      console.log('dawa', query, '->', results.length);
      res.json(results);
    } catch (error) {
      console.error('dawa fejl:', error);
      res.status(500).json({ error: 'Kunne ikke søge efter adresser' });
    }
  }

  static async bbrLookup(req, res) {
    try {
      const data = await BbrService.getBuildingData(req.params.adgangsadresseId, req.query.adresseId);
      if (!data) {
        return res.status(404).json({ error: 'Ingen bygningsdata fundet' });
      }
      console.log('bbr', data.propertyType, data.buildYear, data.livingArea);
      res.json(data);
    } catch (error) {
      console.error('bbr fejl:', error);
      res.status(500).json({ error: 'Kunne ikke hente bygningsdata' });
    }
  }
}

module.exports = { ApiController };
