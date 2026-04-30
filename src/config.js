import dotenv from 'dotenv';
dotenv.config();

export const config = {
  DB_SERVER: process.env.DB_SERVER || '',
  DB_NAME: process.env.DB_NAME || '',
  DB_USER: process.env.DB_USER || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_PORT: parseInt(process.env.DB_PORT || '1433'),

  DATAFORDELER_USERNAME: process.env.DATAFORDELER_USERNAME || '',
  DATAFORDELER_PASSWORD: process.env.DATAFORDELER_PASSWORD || '',
  DATAFORSYNINGEN_TOKEN: process.env.DATAFORSYNINGEN_TOKEN || '',

  PORT: parseInt(process.env.PORT || '3000'),
};
