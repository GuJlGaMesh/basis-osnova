// Model4 r05: append and align fronts; preserve pre-existing objects.
function buildModel4(options) {
 var dims=options.dimensions, stage='validate', changed=false, holder=null,module=null;
 function req(ok,msg){if(!ok)throw new Error(msg);}
 function vec(a){return NewVector(a[0],a[1],a[2]);}
 function checkpoint(s){stage=s;system.writeTextFile('model4-last-run.json',JSON.stringify({revision:'05',stage:stage,dimensions:dims,changed:changed}));}
 function walk(list,fn){for(var i=0;i<list.Count;i++){var o=list.Objects[i];fn(o);if(o.List)walk(o,fn);}}
 try {
  req(dims && dims.length===3,'Enter W H D in millimetres');
  var limits=[[450,800],[712,862],[513,600]], labels=['W','H','D'];
  for(var i=0;i<3;i++)req(typeof dims[i]==='number' && isFinite(dims[i]) && dims[i]>=limits[i][0] && dims[i]<=limits[i][1],labels[i]+' outside tested range '+limits[i].join('..'));
  req(typeof Model!=='undefined' && Model && typeof Model.Load==='function','Model API unavailable');
  req(system.fileExists('lib/native-module.fr3d'),'Missing lib/native-module.fr3d');
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
  holder=OpenFurniture('lib/native-module.fr3d').MountBox(vec([0,0,0]),vec([600,762,523]),vec([0,0,1]),vec([0,1,0]));changed=true;
  req(holder,'Native fragment mount failed');holder.Owner=Model;holder.Build();
  var count=0,panels=0;walk(holder,function(o){count++;if(o.Contour!==undefined && o.Butts!==undefined)panels++;});
  req(holder.Count===1 && count===211 && panels===15,'Unexpected native fragment structure');
  var core=holder.Objects[0];
  checkpoint('resize complete module');
  req(core.IsElastic(),'Native elasticity unavailable');
  if(dims[0]!==600 || dims[1]!==762 || dims[2]!==523){
   var a=core.ElasticResize(vec(dims));
   req(a && Math.abs(a.x-dims[0])<0.01 && Math.abs(a.y-dims[1])<0.01 && Math.abs(a.z-dims[2])<0.01,'Native constraints rejected dimensions');
  }
  var left=Infinity,bottom=Infinity,face=-Infinity;
  walk(holder,function(o){if(o.Contour!==undefined && o.Butts!==undefined){left=Math.min(left,o.GabMin.x);bottom=Math.min(bottom,o.GabMin.y);var z=o.NToGlobal(vec([0,0,1]));if(Math.abs(z.z)>0.99)face=Math.max(face,o.GabMax.z);}});
  holder.Position=vec([(hasGeometry?right:0)-left,-bottom,(front===null?18:front)-face]);
  var pos=core.ToGlobal(vec([0,0,0])),axisZ=core.NToGlobal(vec([0,0,1])),axisY=core.NToGlobal(vec([0,1,0]));
  checkpoint('release native furniture block');module=core;core.Owner=Model;core.OrientGCS(axisZ,axisY);core.Position=pos;
  checkpoint('delete mount shell');DeleteObject(holder);holder=null;core.Build();
  checkpoint('complete');
  if(options.savePath)Action.SaveModel(options.savePath);
  return module;
 }catch(e){if(module){try{DeleteObject(module);}catch(cleanupModule){}}if(holder){try{DeleteObject(holder);}catch(cleanup){}}try{system.writeTextFile('model4-last-run.json',JSON.stringify({revision:'05',stage:stage,changed:changed,error:String(e)}));}catch(ignore){}throw e;}
}
