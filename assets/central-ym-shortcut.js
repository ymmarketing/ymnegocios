(()=>{
 function removeLegacyShortcut(){document.getElementById('centralYmConsoleLink')?.remove()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeLegacyShortcut,{once:true});else removeLegacyShortcut();
 new MutationObserver(()=>requestAnimationFrame(removeLegacyShortcut)).observe(document.body,{childList:true,subtree:true});
})();