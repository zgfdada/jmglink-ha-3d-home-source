export function haConnectionNotice(connection) {
  if (!connection || connection.mock || !connection.configured) return '';
  if (connection.synchronizing) return 'HA 已连接，正在同步实体';
  return connection.connected ? '' : 'HA 离线，正在重连';
}
