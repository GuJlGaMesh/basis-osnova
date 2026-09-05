// Generated panel geometry; native hardware is an explicit package dependency.
function buildModel4(options) {
    var changed=false, stage='preflight', made=[];
    var dims=options.dimensions;
    function requireValue(ok,message){if(!ok)throw new Error(message);}
    function vector(a){return NewVector(a[0],a[1],a[2]);}
    function point(a){return NewPoint(a[0],a[1]);}
    function resolve(path){var o=Model, parts=path.split('.'); for(var i=0;i<parts.length;i++){requireValue(o.Objects && o.Objects[Number(parts[i])],'Missing native owner '+path);o=o.Objects[Number(parts[i])];} return o;}
    function number(n){return typeof n==='number' && isFinite(n);}
    function validate(){
        requireValue(dims && dims.length===3,'Enter W H D in millimetres');
        var limits=[[450,800],[712,862],[513,600]], labels=['W','H','D'];
        for(var k=0;k<3;k++)requireValue(number(dims[k]) && dims[k]>=limits[k][0] && dims[k]<=limits[k][1],labels[k]+' outside tested range '+limits[k].join('..'));
        requireValue(typeof Model!=='undefined' && Model,'No active model');
        requireValue(typeof AddPanel==='function' && typeof DeleteObject==='function' && typeof NewPoint==='function','Required legacy API unavailable');
        requireValue(typeof Model.Load==='function','Model.Load unavailable');
        requireValue(system.fileExists('lib/hardware-template.b3d'),'Missing lib/hardware-template.b3d; keep the package folders together');
        requireValue(DATA.panels.length===15,'Expected 15 source panels');
        for(var i=0;i<DATA.panels.length;i++){
            var d=DATA.panels[i];
            requireValue(number(d.thickness)&&d.thickness>0&&d.material.length>0,'Invalid panel material/thickness '+d.path);
            requireValue(d.cutCount===0&&d.plasticsCount===0,'Unimplemented panel treatment '+d.path);
            requireValue(d.contour.length===d.contourCount && d.contour.length>0,'Invalid contour '+d.path);
            var vv=[d.origin,d.axisY,d.axisZ];
            for(var a=0;a<vv.length;a++)for(var b=0;b<3;b++)requireValue(number(vv[a][b]),'Invalid transform '+d.path);
            for(var k=0;k<d.contour.length;k++){
                var e=d.contour[k]; requireValue(e.kind==='line'||e.kind==='arc'||e.kind==='circle','Unsupported contour '+d.path);
                var pts=e.kind==='circle'?[e.center]:e.kind==='arc'?[e.p1,e.p2,e.center]:[e.p1,e.p2];
                for(var u=0;u<pts.length;u++)requireValue(number(pts[u][0])&&number(pts[u][1]),'Invalid contour coordinate '+d.path);
                if(e.kind==='circle')requireValue(number(e.radius)&&e.radius>0,'Invalid radius '+d.path);
            }
            requireValue(d.butts.length===d.buttCount,'Incomplete edge data '+d.path);
            for(var k=0;k<d.butts.length;k++){
                var b=d.butts[k];requireValue(b.ElemIndex>=0&&b.ElemIndex<d.contour.length&&number(b.Thickness)&&b.Thickness>=0,'Invalid edge '+d.path);
                requireValue(!b.profile||b.profile.length===0,'Unsupported profiled edge '+d.path);
            }
        }
    }
    function addContour(c,items){
        c.Clear();
        for(var i=0;i<items.length;i++){
            var e=items[i];
            if(e.kind==='line')c.AddLine(e.p1[0],e.p1[1],e.p2[0],e.p2[1]);
            else if(e.kind==='arc')c.AddArc(point(e.p1),point(e.p2),point(e.center),e.dir);
            else c.AddCircle(e.center[0],e.center[1],e.radius);
        }
    }
    try {
        validate();
        stage='clear current model';
        Undo.RecursiveChanging(Model);
        var old=[]; for(var i=0;i<Model.Count;i++)old.push(Model.Objects[i]);
        changed=true;
        for(var i=old.length-1;i>=0;i--)DeleteObject(old[i]);
        requireValue(Model.Count===0,'Could not clear current model');
        stage='load native hardware';
        var loaded=Model.Load('lib/hardware-template.b3d');
        requireValue(loaded!==false && Model.Count===10,'Native template load failed');
        var nativeReport=inspectModel(Model,'native-template');
        requireValue(nativeReport.errors.length===0&&nativeReport.objects.length===DATA.nativeObjects,'Native template structure differs from manifest');
        var owners=[]; for(var i=0;i<DATA.panels.length;i++)owners.push(resolve(DATA.panels[i].ownerPath));
        stage='build panels';
        for(var i=0;i<DATA.panels.length;i++){
            var d=DATA.panels[i], p=AddPanel(1,1);
            p.Owner=owners[i];
            p.Name=d.name; p.ArtPos=d.article; p.MaterialName=d.material; p.Thickness=d.thickness;
            p.TextureOrientation=d.texture;
            addContour(p.Contour,d.contour);
            var keys=['ElemIndex','Sign','Material','Thickness','Width','ClipPanel','Overhung','Allowance','CutIndex'];
            for(var b=0;b<d.butts.length;b++){var edge=p.Butts.Add(); for(var k=0;k<keys.length;k++)edge[keys[k]]=d.butts[b][keys[k]];}
            p.OrientGCS(vector(d.axisZ),vector(d.axisY));
            p.Position=owners[i].ToObject(vector(d.origin));
            p.Build();
            made.push(p);
        }
        stage='assemble elastic module';
        var core=Model.Objects[1], extras=[];
        for(var i=2;i<Model.Count;i++)extras.push(Model.Objects[i]);
        for(var i=0;i<extras.length;i++){
            var o=extras[i], pos=o.ToGlobal(vector([0,0,0])), z=o.NToGlobal(vector([0,0,1])), y=o.NToGlobal(vector([0,1,0]));
            o.Owner=core; o.OrientGCS(z,y); o.Position=core.ToObject(pos);
        }
        requireValue(core.IsElastic(),'Native elastic rules unavailable');
        stage='resize complete module';
        if(dims[0]!==600 || dims[1]!==762 || dims[2]!==523){
            var accepted=core.ElasticResize(vector(dims));
            requireValue(accepted && Math.abs(accepted.x-dims[0])<0.01 && Math.abs(accepted.y-dims[1])<0.01 && Math.abs(accepted.z-dims[2])<0.01,'Native constraints rejected requested dimensions');
        }
        stage='verify generated model';
        var actual=inspectModel(Model,'model4-generated');
        requireValue(actual.errors.length===0,'Inspection field errors');
        requireValue(actual.objects.length===DATA.sourceObjects,'Generated object count differs');
        writeReport('model4-last-run.json',{revision:DATA.revision,stage:'complete',dimensions:dims,panels:made.length,elastic:core.IsElastic(),model:actual});
        if(options.savePath){Action.SaveModel(options.savePath);}
        return actual;
    } catch(e) {
        var failure={revision:DATA.revision,stage:stage,changed:changed,panels:made.length,error:String(e)};
        try{writeReport('model4-last-run.json',failure);}catch(logError){}
        throw new Error(stage+': '+String(e)+(changed?' (model replacement started)':''));
    }
}
