export function sidebarFloorOptions(floors = []) {
  return floors.map((floor, index) => ({ id: floor.id, label: `F${index + 1}`, name: floor.name || `F${index + 1}` }));
}
export function emptyFloorSidebar() {
  return { format: 'ha3d-sidebar-v1', width: 380, widgets: [], pages: [{id:'home',name:'主页',icon:'⌂',color:'#f7c95d',items:[]}] };
}
export function resolveSidebarFloor(project, requested) {
  const floors = project?.floors || [];
  const floorId = requested || floors[0]?.id;
  if (floorId && !floors.some(floor => floor.id === floorId)) throw Object.assign(new Error('楼层不存在'), {statusCode:404});
  return floorId;
}
