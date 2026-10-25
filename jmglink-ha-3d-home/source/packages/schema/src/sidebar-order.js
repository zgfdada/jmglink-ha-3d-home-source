export function reorderSidebarPages(pages,fromId,toId){
 const from=pages.findIndex(p=>p.id===fromId),to=pages.findIndex(p=>p.id===toId);
 if(from<0||to<0||from===to)return pages;
 const next=[...pages];next.splice(to,0,next.splice(from,1)[0]);return next;
}
