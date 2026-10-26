import {parse} from 'acorn';
import {ensureSyntaxTree} from '@codemirror/language';
export function codeDiagnostics(view,language){
 const doc=view.state.doc,text=doc.toString();
 if(language==='js'){
  try{parse(text,{ecmaVersion:'latest',allowReturnOutsideFunction:true,allowAwaitOutsideFunction:true});return [];}catch(error){const from=Math.min(error.pos||0,text.length);return [{from,to:Math.min(from+1,text.length),severity:'error',message:error.message}];}
 }
 const tree=ensureSyntaxTree(view.state,doc.length,200);
 // A timed-out background parse is incomplete, so it cannot provide reliable diagnostics.
 if(!tree)return [];
 const issues=[];tree.iterate({enter(node){if(node.type.isError&&issues.length<50)issues.push({from:node.from,to:Math.min(Math.max(node.to,node.from+1),doc.length),severity:'error',message:language==='css'?'CSS 语法错误，请检查此处的选择器、属性或括号':'HTML 语法错误，请检查此处的标签、属性或闭合关系'});}});
 return issues;
}
