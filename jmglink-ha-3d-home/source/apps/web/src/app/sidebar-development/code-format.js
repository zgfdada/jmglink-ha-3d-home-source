export async function formatWidgetCode(code,language){
 const [{format},html,postcss,babel,estree]=await Promise.all([import('prettier/standalone'),import('prettier/plugins/html'),import('prettier/plugins/postcss'),import('prettier/plugins/babel'),import('prettier/plugins/estree')]);
 return format(code,{parser:{html:'html',css:'css',js:'babel'}[language],plugins:[html,postcss,babel,estree],tabWidth:2,useTabs:false,printWidth:90,htmlWhitespaceSensitivity:'css'});
}
