const { createHmac } = require('node:crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ok:false});
  const url = process.env.RSVP_SCRIPT_URL;
  const secret = process.env.RSVP_SECRET;
  if (!url || !secret) return res.status(503).json({ok:false,error:'RSVP is not open yet. Please try again later.'});
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) return res.status(503).json({ok:false});
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ok:false}); }
  if (!body || typeof body !== 'object' || body.website) return res.status(400).json({ok:false});
  const {name, attending, wishes = '', requestId} = body;
  if (typeof name !== 'string' || !name.trim() || name.length > 120 || !['yes','no'].includes(attending) || typeof wishes !== 'string' || wishes.length > 2000 || typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{20,80}$/.test(requestId)) return res.status(400).json({ok:false,error:'Please check your name and attendance choice.'});
  const payload = JSON.stringify({name:name.trim(),attending,wishes:wishes.trim(),requestId,sentAt:Date.now()});
  const signature = createHmac('sha256',secret).update(payload).digest('hex');
  try {
    const response = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload,signature}),signal:AbortSignal.timeout(20000)});
    const result = await response.json();
    if (!response.ok || result.ok !== true || result.requestId !== requestId) throw new Error('Save not confirmed');
    return res.status(200).json({ok:true});
  } catch {
    return res.status(502).json({ok:false,error:'We could not confirm your response. Please try again; your details are still here.'});
  }
};
