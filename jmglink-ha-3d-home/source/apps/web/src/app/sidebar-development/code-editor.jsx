import {a as React} from '../../vendor/react.js';
import {basicSetup} from 'codemirror';
import {HighlightStyle,syntaxHighlighting} from '@codemirror/language';
import {tags} from '@lezer/highlight';
import {EditorView} from '@codemirror/view';
import {EditorState,Compartment} from '@codemirror/state';
import {html} from '@codemirror/lang-html';
import {css} from '@codemirror/lang-css';
import {javascript} from '@codemirror/lang-javascript';
import {linter,lintGutter,forceLinting} from '@codemirror/lint';
import {formatWidgetCode} from './code-format.js';
import {codeDiagnostics} from './code-diagnostics.js';

export default function CodeEditor({value,language,onChange,maxLength,formatRef}){
 const host=React.useRef(null),editor=React.useRef(null),change=React.useRef(onChange),wrapping=React.useRef(new Compartment());
 const [wrap,setWrap]=React.useState(true),[problems,setProblems]=React.useState([]),[formatMessage,setFormatMessage]=React.useState('');
 change.current=onChange;
 React.useEffect(()=>{
  const view=new EditorView({parent:host.current,state:EditorState.create({doc:value||'',extensions:[basicSetup,syntaxHighlighting(HighlightStyle.define([{tag:tags.tagName,color:"#1465c9"},{tag:tags.attributeName,color:"#8450a0"},{tag:[tags.string,tags.attributeValue],color:"#bd3e4e"},{tag:tags.keyword,color:"#8541bd"},{tag:tags.number,color:"#168477"},{tag:tags.comment,color:"#7a899c"}])),language==='html'?html():language==='css'?css():javascript(),wrapping.current.of(EditorView.lineWrapping),EditorView.contentAttributes.of({'aria-label':`${language.toUpperCase()} 编辑器`,spellcheck:'false'}),EditorState.transactionFilter.of(tr=>tr.newDoc.length>maxLength?[]:tr),EditorView.updateListener.of(update=>{if(update.docChanged)change.current(update.state.doc.toString());}),lintGutter(),linter(view=>{const result=codeDiagnostics(view,language);setProblems(result.map(d=>({...d,line:view.state.doc.lineAt(d.from).number,column:d.from-view.state.doc.lineAt(d.from).from+1})));return result;},{delay:400}),EditorView.theme({'&':{height:'440px',fontSize:'13px'},'.cm-scroller':{overflow:'auto',fontFamily:'Consolas, monospace'},'.cm-content':{padding:'12px 0'},'.cm-gutters':{backgroundColor:'#f6f8fc',color:'#8a9ab1',border:'none'},'&.cm-focused':{outline:'none'}})]})});
  editor.current=view;setWrap(true);forceLinting(view);
  formatRef.current=async()=>{const original=view.state.doc.toString();setFormatMessage('正在格式化…');try{const formatted=await formatWidgetCode(original,language);if(editor.current!==view)return;if(view.state.doc.toString()!==original){setFormatMessage('代码已变化，请重新格式化');return;}if(formatted.length>maxLength)throw Error('格式化后超出代码长度限制');view.dispatch({changes:{from:0,to:view.state.doc.length,insert:formatted},userEvent:'input.format'});forceLinting(view);setFormatMessage('格式化完成，可撤销');}catch(error){if(editor.current===view)setFormatMessage('格式化失败，原代码已保留：'+error.message);}};
  return ()=>{editor.current=null;formatRef.current=null;view.destroy();};
 },[language]);
 React.useEffect(()=>{const view=editor.current;if(view&&value!==view.state.doc.toString())view.dispatch({changes:{from:0,to:view.state.doc.length,insert:value||''}});},[value]);
 return <div className="sb-editor-shell"><div className="sb-editor-toolbar"><label><input type="checkbox" checked={wrap} onChange={e=>{setWrap(e.target.checked);editor.current?.dispatch({effects:wrapping.current.reconfigure(e.target.checked?EditorView.lineWrapping:[])});}}/>自动换行</label><button onClick={()=>editor.current&&forceLinting(editor.current)}>校验代码</button></div><div ref={host}/>{formatMessage&&<p className="sb-format-message" role="status">{formatMessage}</p>}<div className={`sb-editor-validation ${problems.length?'has-errors':''}`} role="status">{problems.length?`${problems.length} 处语法问题`:'语法校验通过'}<small>语法校验不执行设备动作，也不验证运行时数据。</small></div>{problems.length>0&&<ul className="sb-editor-errors">{problems.map((p,i)=><li key={i}><button onClick={()=>{const v=editor.current;if(v){v.dispatch({selection:{anchor:p.from},scrollIntoView:true});v.focus();}}}>第 {p.line} 行，第 {p.column} 列：{p.message}</button></li>)}</ul>}</div>;
}
