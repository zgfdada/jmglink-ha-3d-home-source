import {collectLiveEntityIds} from './boundEntityFilter.js';
import {resolveSidebarEntities} from '../../../../packages/schema/src/sidebar-bindings.js';
import {isMoonlightEntity} from '../../../../packages/schema/src/moonlight.js';

export function collectInstanceLiveEntityIds(projects, sidebars, entities, bindings) {
  const ids = new Set();
  for (const {id} of projects.listProjects()) {
    const project = projects.getProject(id);
    for (const entityId of collectLiveEntityIds(project, entities, bindings)) ids.add(entityId);
    for (const floor of project.floors) {
      const workspace = sidebars.get(sidebars.floorKey(project, floor.id));
      for (const config of [workspace.draft,workspace.published]) {
        for (const widget of config.widgets) for (const entityId of resolveSidebarEntities(widget,{},entities).ids) ids.add(entityId);
        for (const page of config.pages) for (const item of page.items) {
          const widget = config.widgets.find(w=>w.id===item.widgetId);
          for (const entityId of resolveSidebarEntities(widget,item,entities).ids) ids.add(entityId);
        }
      }
    }
  }
  for (const entity of entities) if (['weather','sun'].includes(entity.domain) || isMoonlightEntity(entity)) ids.add(entity.entityId);
  return ids;
}
