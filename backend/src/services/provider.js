import axios from 'axios';
const PROVIDER = process.env.PROVIDER;
const API_KEY = process.env.IAK_API_KEY;
const SIGNATURE_KEY = process.env.IAK_SIGNATURE_KEY;

export async function sendTopup(order, game, packageData) {
  if (PROVIDER === 'IAK') {
    const payload = {
      ref_id: order.id,
      produk: packageData.provider_product_code || packageData.sku_code || packageData.id,
      tujuan: order.player_id || order.user_id,
      api_key: API_KEY,
      signature: makeSignature(order.id)
    };
    const res = await axios.post('https://api.iak.id/api/v1/topup', payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  }
  return { error: 'no provider configured' };
}

function makeSignature(ref) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(API_KEY+SIGNATURE_KEY+String(ref)).digest('hex');
}
