/* Only non-identifying game progress is saved on this device. */
(function(){
 const KEY='digital_safety_story_progress_v16';
 function get(){try{let x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&x.v===16&&['mission1.html','mission2.html','mission3.html'].includes(x.page)?x:null}catch(_){return null}}
 function save(page,data){try{localStorage.setItem(KEY,JSON.stringify({v:16,page,data,updated:Date.now()}))}catch(_){}}
 function clear(){try{localStorage.removeItem(KEY)}catch(_){}}
 window.DSProgress={get,save,clear};
})();
