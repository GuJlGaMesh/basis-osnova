var base="C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Documents\\Codex\\model4-r01\\";

var index=system.fileExists(base+'selection-index.txt')?Number(system.readTextFile(base+'selection-index.txt')):0;
var panels=[];function walk(l){for(var i=0;i<l.Count;i++){var o=l.Objects[i];if(o.Contour!==undefined&&o.Butts!==undefined)panels.push(o);if(o.List)walk(o);}}
walk(Model);Model.UnSelectAll();panels[index%panels.length].Selected=true;
system.writeTextFile(base+'selection-index.txt',String(index+1));
