function t(n){return typeof n!="string"?n:(n.endsWith(".")?n.slice(0,-1):n).replace(/\*([^*]+)\*|~([^~]+)~/g,(o,s,c)=>s??c??"")}export{t};
