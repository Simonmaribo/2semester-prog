import { DawaService } from '../services/DawaService.js';
import { BbrService } from '../services/BbrService.js';

export class ApiController {
  static async dawaAutocomplete(req, res) {
    try {
      const query = req.query.q;
      console.log(`[DAWA Autocomplete] Søger efter: "${query}"`);
      if (!query || query.length < 2) { res.json([]); return; }
      const results = await DawaService.autocomplete(query);
      console.log(`[DAWA Autocomplete] Fandt ${results.length} resultater`);
      res.json(results);
    } catch (error) {
      console.error('[DAWA Autocomplete] Fejl:', error);
      res.status(500).json({ error: 'Kunne ikke søge efter adresser' });
    }
  }

  static async bbrLookup(req, res) {
    try {
      const data = await BbrService.getBuildingData(req.params.adgangsadresseId, req.query.adresseId);
      if (!data) { res.status(404).json({ error: 'Ingen bygningsdata fundet' }); return; }
      console.log(`[BBR] Fundet: ${data.propertyType}, byggeår: ${data.buildYear}, areal: ${data.livingArea} m²`);
      res.json(data);
    } catch (error) {
      console.error('[BBR] Fejl:', error);
      res.status(500).json({ error: 'Kunne ikke hente bygningsdata' });
    }
  }
}
