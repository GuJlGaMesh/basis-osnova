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
function inspectModel(list, filename) {
    var result = {schema: 3, apiVersion: system.apiVersion, filename: filename, rootCount: list.Count, objects: [], errors: []};
    function vec(v) { return [v.x, v.y, v.z]; }
    function point(v) { return [v.x, v.y]; }
    function contour(c) {
        var out = [];
        for (var k=0; k<c.Count; k++) {
            var e=c.Objects[k], a={type:e.ElType};
            if(e.IsLine()) { a.kind='line'; a.p1=point(e.AsLine().Pos1); a.p2=point(e.AsLine().Pos2); }
            else if(e.IsArc()) { var arc=e.AsArc(); a.kind='arc'; a.p1=point(arc.Pos1); a.p2=point(arc.Pos2); a.center=point(arc.Center); a.dir=arc.ArcDir; }
            else if(e.IsCircle()) { var circle=e.AsCircle(); a.kind='circle'; a.center=point(circle.Center); a.radius=circle.CirRadius; a.dir=circle.Dir; }
            else { throw new Error('Unsupported contour element '+e.ElType); }
            out.push(a);
        }
        return out;
    }
    function field(target, key, fn, path) {
        try { var value = fn(); if (value !== undefined) target[key] = value; }
        catch (e) { result.errors.push({path: path, field: key, message: String(e)}); }
    }
    function walk(o, path) {
        var r = {path: path};
        result.objects.push(r);
        field(r, 'name', function () { return String(o.Name); }, path);
        field(r, 'article', function () { return String(o.ArtPos); }, path);
        field(r, 'list', function () { return o.List; }, path);
        field(r, 'count', function () { return o.Count; }, path);
        field(r, 'gmin', function () { return vec(o.GabMin); }, path);
        field(r, 'gmax', function () { return vec(o.GabMax); }, path);
        field(r, 'origin', function () { return vec(o.ToGlobal(NewVector(0,0,0))); }, path);
        field(r, 'axisZ', function () { return vec(o.NToGlobal(NewVector(0,0,1))); }, path);
        field(r, 'axisY', function () { return vec(o.NToGlobal(NewVector(0,1,0))); }, path);
        field(r, 'thickness', function () { return o.Thickness; }, path);
        if (o.Butts !== undefined && o.Contour !== undefined) {
            r.panel = true;
            field(r, 'material', function () { return String(o.MaterialName); }, path);
            field(r, 'contourWidth', function () { return o.ContourWidth; }, path);
            field(r, 'contourHeight', function () { return o.ContourHeight; }, path);
            field(r, 'texture', function () { return o.TextureOrientation; }, path);
            field(r, 'contourCount', function () { return o.Contour.Count; }, path);
            field(r, 'buttCount', function () { return o.Butts.Count; }, path);
            field(r, 'cutCount', function () { return o.Cuts.Count; }, path);
            field(r, 'plasticsCount', function () { return o.Plastics.Count; }, path);
            field(r, 'contour', function () { return contour(o.Contour); }, path);
            field(r, 'butts', function () {
                var items=[], keys=['ElemIndex','Sign','Material','Thickness','Width','ClipPanel','Overhung','Allowance','CutIndex'];
                for(var b=0;b<o.Butts.Count;b++) { var row={}, butt=o.Butts.Butts[b]; for(var f=0;f<keys.length;f++) row[keys[f]]=butt[keys[f]]; row.profile=butt.Profile ? contour(butt.Profile) : null; items.push(row); }
                return items;
            }, path);
        }
        if (r.list || (r.count > 0)) {
            for (var i = 0; i < o.Count; i++) walk(o.Objects[i], path + '.' + i);
        }
    }
    for (var i = 0; i < list.Count; i++) walk(list.Objects[i], String(i));
    return result;
}
function writeReport(path, data) { system.writeTextFile(path, JSON.stringify(data,null,2).replace(/[\u0080-\uffff]/g,function(c){return '\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4);})); }

var base="C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Documents\\Codex\\model4-r01\\";
try {
 var ws=[450,600,800],hs=[712,762,862],ds=[513,523,600],n=0;
 for(var w=0;w<3;w++)for(var h=0;h<3;h++)for(var d=0;d<3;d++){
  var dims=[ws[w],hs[h],ds[d]];buildModel4({dimensions:dims});
  writeReport(base+'r03-test-'+n+'.json',{dimensions:dims,model:inspectModel(Model,'r03')});n++;
 }
 buildModel4({dimensions:[600,762,520],savePath:base+'model4-r03.b3d'});
 writeReport(base+'r03-final.json',inspectModel(Model,'r03'));
 Action.LoadModel(base+'model4-r03.b3d');writeReport(base+'r03-reopened.json',inspectModel(Model,'r03'));
 Model.UnSelectAll();Model.Objects[1].Objects[7].Selected=true;
 writeReport(base+'r03-complete.json',{cases:n,done:true});
}catch(e){writeReport(base+'r03-test-error.json',{error:String(e)});}
