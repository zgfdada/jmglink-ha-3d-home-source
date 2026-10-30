import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {isWebglFailure,disposePreviewObject} from '../apps/web/src/domain/webgl-recovery.js';
import {clientErrorRecord} from '../apps/web/src/domain/browser-recovery.js';
import {normalizeClientError} from '../apps/server/src/routes/clientErrors.js';

test('WebGL context allocation and loss are recognized without disguising unrelated render errors',()=>{
  for(const message of ['Error creating WebGL context.','Error creating WebGL context with your selected attributes.','WebGL context lost']){
    assert.equal(isWebglFailure(new Error(message)),true);
    assert.equal(normalizeClientError(clientErrorRecord(new Error(message),'render')).signature,'webgl-context');
  }
  assert.equal(isWebglFailure(new Error('Cannot read properties of null')),false);
});

test('preview disposal releases textures, shared geometry and materials once',()=>{
  const texture=new THREE.Texture(),material=new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture});
  const geometry=new THREE.BoxGeometry(),root=new THREE.Group();
  root.add(new THREE.Mesh(geometry,material),new THREE.Mesh(geometry,material));
  const count={texture:0,material:0,geometry:0};
  texture.addEventListener('dispose',()=>count.texture++);material.addEventListener('dispose',()=>count.material++);geometry.addEventListener('dispose',()=>count.geometry++);
  disposePreviewObject(root);
  assert.deepEqual(count,{texture:1,material:1,geometry:1});
});
