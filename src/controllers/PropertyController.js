const { Property } = require('../models/Property.js');
const { InvestmentCase } = require('../models/InvestmentCase.js');
const { WmsService } = require('../services/WmsService.js');

class PropertyController {
  static async showHome(req, res, next) {
    try {
      const properties = await Property.findByUserId(req.session.userId);
      res.render('home', {
        title: 'Mine ejendomme',
        properties,
        error: null,
        success: null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProperty(req, res, next) {
    try {
      const {
        address, dawa_address_id, latitude, longitude,
        property_type, build_year, living_area, rooms,
      } = req.body;

      if (!address) {
        const properties = await Property.findByUserId(req.session.userId);
        return res.render('home', {
          title: 'Mine ejendomme',
          properties,
          error: 'Vælg venligst en adresse fra søgeresultaterne.',
          success: null,
        });
      }

      const property = await Property.create({
        user_id: req.session.userId,
        address,
        dawa_address_id,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        property_type,
        build_year: build_year ? parseInt(build_year) : undefined,
        living_area: living_area ? parseFloat(living_area) : undefined,
        rooms: rooms ? parseInt(rooms) : undefined,
      });

      res.redirect(`/properties/${property.id}`);
    } catch (error) {
      next(error);
    }
  }

  static async showProperty(req, res, next) {
    try {
      const property = await Property.findById(parseInt(req.params.id));

      if (!property || property.user_id !== req.session.userId) {
        return res.status(404).render('error', {
          title: 'Ikke fundet',
          message: 'Ejendommen blev ikke fundet.',
          error: null,
        });
      }

      const cases = await InvestmentCase.findByPropertyId(property.id);

      let aerialPhotoUrl = null;
      if (property.latitude && property.longitude) {
        aerialPhotoUrl = WmsService.getAerialPhotoUrl(property.latitude, property.longitude);
      }

      res.render('property', {
        title: property.address,
        property,
        cases,
        aerialPhotoUrl,
        error: null,
        success: null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProperty(req, res, next) {
    try {
      const property = await Property.findById(parseInt(req.params.id));

      if (!property || property.user_id !== req.session.userId) {
        res.status(403).render('error', {
          title: 'Ejendomsprofil ikke fundet',
          message: 'Denne ejendomsprofil findes ikke',
          error: null,
        });
        return;
      }

      await Property.delete(property.id);
      res.redirect('/properties');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { PropertyController };
