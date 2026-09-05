// Model4 r03: keep native panel identities and their dependent objects.
function buildModel4(options) {
 var dims=options.dimensions, stage='validate', changed=false;
 function req(ok,msg){if(!ok)throw new Error(msg);}
 function vec(a){return NewVector(a[0],a[1],a[2]);}
 function checkpoint(s){stage=s;system.writeTextFile('model4-last-run.json',JSON.stringify({revision:'03',stage:stage,dimensions:dims,changed:changed}));}
 function walk(list,fn){for(var i=0;i<list.Count;i++){var o=list.Objects[i];fn(o);if(o.List)walk(o,fn);}}
 try {
  req(dims && dims.length===3,'Enter W H D in millimetres');
  var limits=[[450,800],[712,862],[513,600]], labels=['W','H','D'];
  for(var i=0;i<3;i++)req(typeof dims[i]==='number' && isFinite(dims[i]) && dims[i]>=limits[i][0] && dims[i]<=limits[i][1],labels[i]+' outside tested range '+limits[i].join('..'));
  req(typeof Model!=='undefined' && Model && typeof Model.Load==='function','Model API unavailable');
  req(system.fileExists('lib/native-base.b3d'),'Missing lib/native-base.b3d');
  checkpoint('clear current model');
  Undo.RecursiveChanging(Model);Model.UnSelectAll();
  changed=true;
  while(Model.Count>0)DeleteObject(Model.Objects[Model.Count-1]);
  checkpoint('load complete native assembly');
  req(Model.Load('lib/native-base.b3d')!==false,'Native assembly load failed');
  var count=0,panels=0;walk(Model,function(o){count++;if(o.Contour!==undefined && o.Butts!==undefined)panels++;});
  req(Model.Count===10 && count===212 && panels===15,'Unexpected native assembly structure');
  checkpoint('assemble elastic module');
  var core=Model.Objects[1],extras=[];
  for(var i=2;i<Model.Count;i++)extras.push(Model.Objects[i]);
  for(var i=0;i<extras.length;i++){
   var o=extras[i],pos=o.ToGlobal(vec([0,0,0])),z=o.NToGlobal(vec([0,0,1])),y=o.NToGlobal(vec([0,1,0]));
   o.Owner=core;o.OrientGCS(z,y);o.Position=core.ToObject(pos);
  }
  checkpoint('resize complete module');
  req(core.IsElastic(),'Native elasticity unavailable');
  if(dims[0]!==600 || dims[1]!==762 || dims[2]!==523){
   var a=core.ElasticResize(vec(dims));
   req(a && Math.abs(a.x-dims[0])<0.01 && Math.abs(a.y-dims[1])<0.01 && Math.abs(a.z-dims[2])<0.01,'Native constraints rejected dimensions');
  }
  checkpoint('complete');
  if(options.savePath)Action.SaveModel(options.savePath);
  return core;
 }catch(e){try{system.writeTextFile('model4-last-run.json',JSON.stringify({revision:'03',stage:stage,changed:changed,error:String(e)}));}catch(ignore){}throw e;}
}

try {
 var raw=prompt('\u0420\u0430\u0437\u043c\u0435\u0440\u044b \u0428 \u0412 \u0413 \u0432 \u043c\u043c \u0447\u0435\u0440\u0435\u0437 \u043f\u0440\u043e\u0431\u0435\u043b. \u041f\u0440\u0438\u043c\u0435\u0440: 600 762 523.\n\u0428: 450..800; \u0412 \u043a\u043e\u0440\u043f\u0443\u0441\u0430 \u0431\u0435\u0437 \u043e\u043f\u043e\u0440: 712..862; \u0413 \u0441 \u0437\u0430\u0434\u043d\u0438\u043a\u043e\u043c \u0431\u0435\u0437 \u0444\u0430\u0441\u0430\u0434\u0430: 513..600.\n\u0422\u0435\u043a\u0443\u0449\u0430\u044f \u043c\u043e\u0434\u0435\u043b\u044c \u0431\u0443\u0434\u0435\u0442 \u0437\u0430\u043c\u0435\u043d\u0435\u043d\u0430. \u041e\u0442\u043c\u0435\u043d\u0430 \u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u0442 \u0435\u0451 \u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439.');
 if(raw!==null && raw!==undefined && String(raw).replace(/\s/g,'')!==''){
  var parts=String(raw).replace(/^\s+|\s+$/g,'').split(/\s+/), dims=[];
  if(parts.length!==3)throw new Error('\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0440\u043e\u0432\u043d\u043e \u0442\u0440\u0438 \u0440\u0430\u0437\u043c\u0435\u0440\u0430: \u0428 \u0412 \u0413');
  for(var i=0;i<3;i++)dims.push(Number(parts[i].replace(',','.')));
  buildModel4({dimensions:dims});
  alert('\u041c\u043e\u0434\u0435\u043b\u044c4 r03 \u043f\u043e\u0441\u0442\u0440\u043e\u0435\u043d\u0430. \u041a\u043e\u0440\u043f\u0443\u0441, \u0444\u0430\u0441\u0430\u0434\u044b, \u044f\u0449\u0438\u043a\u0438 \u0438 GOLA \u043e\u0431\u044a\u0435\u0434\u0438\u043d\u0435\u043d\u044b \u0432 \u044d\u043b\u0430\u0441\u0442\u0438\u0447\u043d\u044b\u0439 \u043c\u043e\u0434\u0443\u043b\u044c. \u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0435 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043d\u043e\u0432\u044b\u043c \u0444\u0430\u0439\u043b\u043e\u043c.');
 }
} catch(e){alert('\u041c\u043e\u0434\u0435\u043b\u044c4: '+String(e));}
