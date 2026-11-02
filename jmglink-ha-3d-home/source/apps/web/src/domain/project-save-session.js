export function createProjectSaveSession(project) {
  return {projectId:project.id, generation:0, baseVersion:project.version, blocked:false};
}
export function finishProjectSave(session, ticket, current, saved) {
  if (session.projectId !== ticket.projectId) return {project:current, dirty:true};
  session.baseVersion = saved.version;
  const dirty = session.generation !== ticket.generation || (ticket.snapshot !== undefined && current !== ticket.snapshot);
  return {project:dirty ? {...current,version:saved.version} : saved, dirty};
}
