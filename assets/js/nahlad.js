/* NÁHĽAD: backend zberu kontaktov beží až na fantomopery.sk. Tu sa nič neodosiela, formulár len ukáže, ako bude fungovať. Na produkciu tento súbor nepatrí. */
(function(){window.fetch=function(u){if(String(u).indexOf("/waitlist/")===0){return Promise.resolve({json:function(){return Promise.resolve({ok:true,dup:false});}});}return Promise.reject(new Error("preview"));};})();
