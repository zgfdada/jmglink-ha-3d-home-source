import test from 'node:test';import assert from 'node:assert/strict';import {overlayRefitKey} from '../apps/web/src/domain/camera-refit.js';
test('home overlays never request a refit when sidebar or device panels change on any edge',()=>{
 const base={top:62,right:132,bottom:74,left:428,preserveViewOnPanelChange:true};
 for(const changed of [{left:24},{top:12},{right:430},{bottom:238},{left:24,top:12,right:430,bottom:238}])assert.equal(overlayRefitKey({...base,...changed}),overlayRefitKey(base));
 assert.notEqual(overlayRefitKey({...base,preserveViewOnPanelChange:false}),overlayRefitKey({...base,left:24,preserveViewOnPanelChange:false}));
});
