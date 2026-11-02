export const LUNAR_INSTALL_URL='https://github.com/ngocjohn/lunar-phase#installation';
export function moonlightNotice(moon,connection,moonIntensity=1) {
  if(connection?.configured && !connection.connected) return {text:connection.synchronizing?'HA 正在同步，完成后检查月光数据。':'HA 离线，恢复连接后自动检查月光数据。',status:'connection'};
  const messages={
    missing:'未检测到月光位置数据。请安装并配置 Lunar Phase；若已安装，请确认主实体已启用。',
    incomplete:'月光数据不完整。请检查 Lunar Phase 主实体是否包含方位角、高度角和照亮比例。',
    unavailable:'月光实体不可用，请检查 Lunar Phase 集成状态，恢复后会自动启用。',
    invalid:'月光数据值异常，请检查 Lunar Phase 的角度和照亮比例，暂不生成月光投影。',
    stale:'月光数据超过 10 分钟未更新，请检查 Lunar Phase 是否正常运行，暂不生成月光投影。',
    sun_unavailable:'太阳位置数据不可用，无法判断昼夜，暂不启用月光；请检查 sun.sun。',
    daytime:'当前为白天，月光暂不启用（正常）。',
    below_horizon:'月亮尚未升起或已经落下，月光暂不启用（正常）。',
    unlit:'当前月面照亮比例为 0%，不生成月光投影（正常）。',
    active:'月光已启用。',
  };
  if(moon.available && moonIntensity===0)return {text:'月光强度已设为 0%，调高后恢复月光显示。',status:'disabled'};
  return {text:messages[moon.reason]??'月光数据不可用，暂不生成月光投影。',status:moon.reason,installUrl:moon.reason==='missing'?LUNAR_INSTALL_URL:undefined};
}
