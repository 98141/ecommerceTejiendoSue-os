const isObjectId = (v) => typeof v === 'string' && v.match(/^[0-9a-fA-F]{24}$/);

function requireIds({ productId, sizeId, colorId }) {
  if (!isObjectId(productId)) throw new Error('productId inválido');
  if (sizeId != null && sizeId !== '' && !isObjectId(sizeId)) throw new Error('sizeId inválido');
  if (colorId != null && colorId !== '' && !isObjectId(colorId)) throw new Error('colorId inválido');
}

module.exports = { isObjectId, requireIds };
