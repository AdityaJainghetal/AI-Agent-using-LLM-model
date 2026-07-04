// Lightweight validator: pass a schema { field: { required, type, min, max, enum } }
module.exports = (schema) => (req, res, next) => {
  const errors = [];
  for (const [key, rule] of Object.entries(schema)) {
    const v = req.body[key];
    if (rule.required && (v === undefined || v === null || v === '')) {
      errors.push(`${key} is required`);
      continue;
    }
    if (v === undefined) continue;
    if (rule.type === 'string' && typeof v !== 'string') errors.push(`${key} must be string`);
    if (rule.type === 'number' && typeof v !== 'number') errors.push(`${key} must be number`);
    if (rule.type === 'email' && !/^\S+@\S+\.\S+$/.test(v)) errors.push(`${key} must be valid email`);
    if (rule.min && String(v).length < rule.min) errors.push(`${key} too short`);
    if (rule.max && String(v).length > rule.max) errors.push(`${key} too long`);
    if (rule.enum && !rule.enum.includes(v)) errors.push(`${key} must be one of ${rule.enum.join(',')}`);
  }
  if (errors.length) return res.status(400).json({ message: errors.join('; ') });
  next();
};
