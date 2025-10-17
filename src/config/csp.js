/**
 * Content Security Policy Configuration
 * NOTE: unsafe-inline gerekli (onclick/onkeypress event handler'lar için)
 * TODO: addEventListener ile değiştir ve unsafe-inline'ı kaldır
 */
export const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  scriptSrcAttr: ["'unsafe-inline'"], // Inline event handlers için (onclick, onkeypress)
  styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:'],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
};
