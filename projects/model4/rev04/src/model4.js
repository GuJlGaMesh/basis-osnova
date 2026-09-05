// Model4 r04: append and align fronts; preserve pre-existing objects.
function buildModel4(options) {
 var dims=options.dimensions, stage='validate', changed=false, holder=null;
 function req(ok,msg){if(!ok)throw new Error(msg);}
 function vec(a){return NewVector(a[0],a[1],a[2]);}
 function checkpoint(s){stage=s;system.writeTextFile('model4-last-run.json',JSON.stringify({revision:'04',stage:stage,dimensions:dims,changed:changed}));}
 function walk(list,fn){for(var i=0;i<list.Count;i++){var o=list.Objects[i];fn(o);if(o.List)walk(o,fn);}}
 try {
  req(dims && dims.length===3,'Enter W H D in millimetres');
  var limits=[[450,800],[712,862],[513,600]], labels=['W','H','D'];
  for(var i=0;i<3;i++)req(typeof dims[i]==='number' && isFinite(dims[i]) && dims[i]>=limits[i][0] && dims[i]<=limits[i][1],labels[i]+' outside tested range '+limits[i].join('..'));
  req(typeof Model!=='undefined' && Model && typeof Model.Load==='function','Model API unavailable');
  req(system.fileExists('lib/native-base.b3d'),'Missing lib/native-base.b3d');
  var existing=[],right=0,hasGeometry=false,front=null;
  for(var i=0;i<Model.Count;i++)existing.push(Model.Objects[i]);
  walk(Model,function(o){
   if(o.Contour!==undefined && o.Butts!==undefined){
    var x=o.GabMax.x;if(isFinite(x)){right=hasGeometry?Math.max(right,x):x;hasGeometry=true;}
    var z=o.NToGlobal(vec([0,0,1]));
    if(Math.abs(z.z)>0.99){var f=o.GabMax.z;if(isFinite(f))front=front===null?f:Math.max(front,f);}
   }
  });
  checkpoint('append native assembly');
  holder=AddBlock('Model4 r04');changed=true;
  req(holder.Load('lib/native-base.b3d')!==false,'Native assembly load failed');
  holder.Owner=Model;
  var count=0,panels=0;walk(holder,function(o){count++;if(o.Contour!==undefined && o.Butts!==undefined)panels++;});
  req(holder.Count===10 && count===212 && panels===15,'Unexpected native assembly structure');
  checkpoint('assemble elastic module');
  var core=holder.Objects[1],extras=[];
  for(var i=2;i<holder.Count;i++)extras.push(holder.Objects[i]);
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
  holder.Position=vec([hasGeometry?right:0,0,(front===null?18:front)-(dims[2]-523+18)]);
  checkpoint('complete');
  if(options.savePath)Action.SaveModel(options.savePath);
  return holder;
 }catch(e){if(holder){try{DeleteObject(holder);}catch(cleanup){}}try{system.writeTextFile('model4-last-run.json',JSON.stringify({revision:'04',stage:stage,changed:changed,error:String(e)}));}catch(ignore){}throw e;}
}

try {
 var raw=prompt('\u0420\u0430\u0437\u043c\u0435\u0440\u044b \u0428 \u0412 \u0413 \u0432 \u043c\u043c \u0447\u0435\u0440\u0435\u0437 \u043f\u0440\u043e\u0431\u0435\u043b. \u041f\u0440\u0438\u043c\u0435\u0440: 600 762 523.\n\u0428: 450..800; \u0412 \u043a\u043e\u0440\u043f\u0443\u0441\u0430 \u0431\u0435\u0437 \u043e\u043f\u043e\u0440: 712..862; \u0413 \u0441 \u0437\u0430\u0434\u043d\u0438\u043a\u043e\u043c \u0431\u0435\u0437 \u0444\u0430\u0441\u0430\u0434\u0430: 513..600.\n\u041d\u043e\u0432\u044b\u0439 \u043c\u043e\u0434\u0443\u043b\u044c \u0434\u043e\u0431\u0430\u0432\u0438\u0442\u0441\u044f \u0441\u043f\u0440\u0430\u0432\u0430 \u0441 \u0432\u044b\u0440\u0430\u0432\u043d\u0438\u0432\u0430\u043d\u0438\u0435\u043c \u043f\u043e \u043b\u0438\u0446\u0443. \u0421\u0442\u0430\u0440\u044b\u0435 \u043e\u0431\u044a\u0435\u043a\u0442\u044b \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u044e\u0442\u0441\u044f.');
 if(raw!==null && raw!==undefined && String(raw).replace(/\s/g,'')!==''){
  var parts=String(raw).replace(/^\s+|\s+$/g,'').split(/\s+/), dims=[];
  if(parts.length!==3)throw new Error('\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0440\u043e\u0432\u043d\u043e \u0442\u0440\u0438 \u0440\u0430\u0437\u043c\u0435\u0440\u0430: \u0428 \u0412 \u0413');
  for(var i=0;i<3;i++)dims.push(Number(parts[i].replace(',','.')));
  buildModel4({dimensions:dims});
  alert('\u041c\u043e\u0434\u0435\u043b\u044c4 r04 \u043f\u043e\u0441\u0442\u0440\u043e\u0435\u043d\u0430. \u041a\u043e\u0440\u043f\u0443\u0441, \u0444\u0430\u0441\u0430\u0434\u044b, \u044f\u0449\u0438\u043a\u0438 \u0438 GOLA \u043e\u0431\u044a\u0435\u0434\u0438\u043d\u0435\u043d\u044b \u0432 \u044d\u043b\u0430\u0441\u0442\u0438\u0447\u043d\u044b\u0439 \u043c\u043e\u0434\u0443\u043b\u044c. \u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0435 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043d\u043e\u0432\u044b\u043c \u0444\u0430\u0439\u043b\u043e\u043c.');
 }
} catch(e){alert('\u041c\u043e\u0434\u0435\u043b\u044c4: '+String(e));}
