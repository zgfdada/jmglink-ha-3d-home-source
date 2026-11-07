import * as THREE from 'three';
export function createCinemaModelPreview(shape, dimensions) {
  const root = new THREE.Group();
  const {width:w,height:h,depth:d}=dimensions;
  const box=(name,size,position,color)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:.48}));mesh.name=name;mesh.position.set(...position);root.add(mesh);return mesh;};
  if(shape==='cinema_projector'){
    box('Projector_Body',[w,h,d],[0,h/2,0],'#eeeae1');
    box('Wall_Mount',[w*.78,h*1.1,.04],[0,h/2,d/2+.02],'#d9d5cc');
    const lens=new THREE.Mesh(new THREE.CylinderGeometry(w*.12,w*.12,.018,32),new THREE.MeshPhysicalMaterial({color:'#a5b9c9',roughness:.12,clearcoat:.9}));lens.rotation.x=Math.PI/2;lens.position.set(0,h/2,-d/2-.01);root.add(lens);
  }else if(shape==='cinema_screen'){
    box('Screen_Housing',[w+.14,.105,.12],[0,h+.05,0],'#e8e4da');
    box('Screen_Sheet',[w,h,.012],[0,h/2,-.08],'#f1f4f0');
    box('Screen_Bottom_Bar',[w+.055,.028,.035],[0,0,-.08],'#d5d5cf');
  }else{
    box('Speaker_Body',[w,h,d],[0,h/2,0],'#e8e3d9');
    box('Speaker_Grille',[w*.84,h*.82,.012],[0,h/2,-d/2-.008],'#c3c8c4');
    const cone=new THREE.Mesh(new THREE.CylinderGeometry(w*.3,w*.3,.012,32),new THREE.MeshStandardMaterial({color:'#a4aaa8'}));cone.rotation.x=Math.PI/2;cone.position.set(0,h*.53,-d/2-.02);root.add(cone);
  }
  return root;
}
