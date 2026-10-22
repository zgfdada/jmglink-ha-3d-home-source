export function energyAccountName(entity, overrides = {}, index = 0) {
 const a=entity.attributes || {};
 return String(overrides[entity.entityId]?.trim() || a.title || a.customer_name || a.user_name || a.friendly_name || entity.name || entity.entityId || `用电账户 ${index+1}`);
}
