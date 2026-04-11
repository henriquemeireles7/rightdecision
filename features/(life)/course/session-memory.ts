/**
 * Client-side session memory script. Saves/restores reading position.
 * Renders as inline <script> in ClassView.
 */
export function getSessionMemoryScript(classId: string, courseSlug: string): string {
  return `(function(){var k="rd_session_${courseSlug}",c="${classId}";
try{
var s=JSON.parse(localStorage.getItem(k)||"{}");
if(s.classId===c&&s.scrollY>0){window.scrollTo({top:s.scrollY,behavior:"smooth"})}
localStorage.setItem(k,JSON.stringify({classId:c,scrollY:0,ts:Date.now()}));
var save=function(){var d=JSON.stringify({classId:c,scrollY:window.scrollY,ts:Date.now()});localStorage.setItem(k,d)};
window.addEventListener("scroll",save,{passive:true});
window.addEventListener("beforeunload",save);
}catch(e){}})()`.replace(/\n/g, '')
}
