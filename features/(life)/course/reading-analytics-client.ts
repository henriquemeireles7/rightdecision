/**
 * Client-side reading analytics tracker (<1KB minified).
 * Renders as inline <script> in ClassView.
 *
 * Tracks: time spent (pauses on hidden tab), scroll depth via scroll events.
 * Sends: every 30s heartbeat + on page unload via sendBeacon.
 */
export function getReadingAnalyticsScript(classId: string, courseSlug: string): string {
  return `(function(){var c="${classId}",s="${courseSlug}",t=0,d=0,p=true,k="ra_"+c;
function sd(){var h=document.documentElement.scrollHeight-window.innerHeight;if(h>0)d=Math.max(d,Math.round(window.scrollY/h*100))}
function send(){var b=JSON.stringify({classId:c,courseSlug:s,timeSpentSec:t,scrollDepth:d});if(navigator.sendBeacon)navigator.sendBeacon("/api/analytics/reading",new Blob([b],{type:"application/json"}));else{var x=new XMLHttpRequest();x.open("POST","/api/analytics/reading");x.setRequestHeader("Content-Type","application/json");x.send(b)}t=0}
window.addEventListener("scroll",sd,{passive:true});
document.addEventListener("visibilitychange",function(){p=document.visibilityState==="visible"});
setInterval(function(){if(p)t++},1000);
setInterval(function(){if(t>0)send()},30000);
window.addEventListener("beforeunload",function(){if(t>0)send()});
sd()})()`.replace(/\n/g, '')
}
