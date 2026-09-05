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
var sources=[{"id": "ref-01", "name": "\u0410\u043c\u0430\u043b\u0438\u044f \u041a\u0443\u0445\u043d\u044f \u0438\u0442\u043e\u0433.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0410\u043c\u0430\u043b\u0438\u044f \u041a\u0443\u0445\u043d\u044f \u0438\u0442\u043e\u0433.b3d"}, {"id": "ref-02", "name": "\u0412\u0430\u043d\u043d\u0430\u044f \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u0434\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0412\u0430\u043d\u043d\u0430\u044f \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u0434\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d"}, {"id": "ref-03", "name": "\u0413\u0430\u0440\u0434\u0435\u0440\u043e\u0431\u043d\u0430\u044f \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u0434\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0413\u0430\u0440\u0434\u0435\u0440\u043e\u0431\u043d\u0430\u044f \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u0434\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d"}, {"id": "ref-04", "name": "\u0414\u0435\u0442\u0441\u043a\u0430\u044f \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u0434\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0414\u0435\u0442\u0441\u043a\u0430\u044f \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u0434\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d"}, {"id": "ref-05", "name": "\u041a\u043e\u0440\u0436.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u041a\u043e\u0440\u0436.b3d"}, {"id": "ref-06", "name": "\u041a\u0443\u043f\u0435 \u0421\u0442\u0430\u0440\u043e\u0435 \u0416\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u041a\u0443\u043f\u0435 \u0421\u0442\u0430\u0440\u043e\u0435 \u0416\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435.b3d"}, {"id": "ref-07", "name": "\u041a\u0443\u043f\u0435.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u041a\u0443\u043f\u0435.b3d"}, {"id": "ref-08", "name": "\u041b\u0435\u0433\u0435\u043d\u0434\u0430 \u043f\u0430\u0440\u043a. \u0410\u043d\u0434\u0440\u0435\u0439. \u041a\u0443\u0445\u043d\u044f.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u041b\u0435\u0433\u0435\u043d\u0434\u0430 \u043f\u0430\u0440\u043a. \u0410\u043d\u0434\u0440\u0435\u0439. \u041a\u0443\u0445\u043d\u044f.b3d"}, {"id": "ref-09", "name": "\u041b\u0435\u0433\u0435\u043d\u0434\u0430 \u041f\u0430\u0440\u043a. \u042d\u043b\u0435\u043a\u0442\u0440\u0438\u043a.\u041f\u0440\u0438\u0445\u043e\u0436\u0430\u044f.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u041b\u0435\u0433\u0435\u043d\u0434\u0430 \u041f\u0430\u0440\u043a. \u042d\u043b\u0435\u043a\u0442\u0440\u0438\u043a.\u041f\u0440\u0438\u0445\u043e\u0436\u0430\u044f.b3d"}, {"id": "ref-10", "name": "\u041c\u043e\u0434\u0435\u043b\u044c1.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u041c\u043e\u0434\u0435\u043b\u044c1.b3d"}, {"id": "ref-11", "name": "\u041c\u043e\u0434\u0435\u043b\u044c4.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u041c\u043e\u0434\u0435\u043b\u044c4.b3d"}, {"id": "ref-12", "name": "\u041f\u0440\u0438\u0445\u043e\u0436\u0430\u044f \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u043b\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u041f\u0440\u0438\u0445\u043e\u0436\u0430\u044f \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u043b\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d"}, {"id": "ref-13", "name": "\u041f\u0440\u0438\u0445\u043e\u0436\u0430\u044f.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u041f\u0440\u0438\u0445\u043e\u0436\u0430\u044f.b3d"}, {"id": "ref-14", "name": "\u0421\u0435\u0440\u0433\u0435\u0439 \u041b\u0435\u0433\u0435\u043d\u0434\u0430 \u041f\u0440\u0438\u0445\u043e\u0436\u0430\u044f.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0421\u0435\u0440\u0433\u0435\u0439 \u041b\u0435\u0433\u0435\u043d\u0434\u0430 \u041f\u0440\u0438\u0445\u043e\u0436\u0430\u044f.b3d"}, {"id": "ref-15", "name": "\u0421\u043f\u0430\u043b\u044c\u043d\u0430\u044f \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u0434\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0421\u043f\u0430\u043b\u044c\u043d\u0430\u044f \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u0434\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d"}, {"id": "ref-16", "name": "\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043d\u043e\u0435 \u0421\u043f\u0430\u043b\u044c\u043d\u044f.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043d\u043e\u0435 \u0421\u043f\u0430\u043b\u044c\u043d\u044f.b3d"}, {"id": "ref-17", "name": "\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435 \u0434\u0435\u0442\u0441\u043a\u0430\u044f \u0414.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435 \u0434\u0435\u0442\u0441\u043a\u0430\u044f \u0414.b3d"}, {"id": "ref-18", "name": "\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435 \u0434\u0435\u0442\u0441\u043a\u0430\u044f \u041c.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435 \u0434\u0435\u0442\u0441\u043a\u0430\u044f \u041c.b3d"}, {"id": "ref-19", "name": "\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435 \u041f\u043e\u0441\u0442\u0438\u0440\u043e\u0447\u043d\u0430\u044f.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435 \u041f\u043e\u0441\u0442\u0438\u0440\u043e\u0447\u043d\u0430\u044f.b3d"}, {"id": "ref-20", "name": "\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435 \u0422\u0412 \u0437\u043e\u043d\u0430.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435 \u0422\u0412 \u0437\u043e\u043d\u0430.b3d"}, {"id": "ref-21", "name": "\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435. \u041f\u0440\u0438\u0445\u043e\u0436\u0430\u044f.b3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0421\u0442\u0430\u0440\u043e\u0436\u0438\u0432\u043e\u0442\u0438\u043d\u043e\u0435. \u041f\u0440\u0438\u0445\u043e\u0436\u0430\u044f.b3d"}, {"id": "ref-22", "name": "\u0422\u0412 \u0437\u043e\u043d\u0430 \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u0434\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d", "source": "C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Desktop\\\u041c\u043e\u0434\u0435\u043b\u0438\\\u0422\u0412 \u0437\u043e\u043d\u0430 \u041b\u0435\u043d\u0438\u043d\u0433\u0440\u0430\u0434\u0441\u043a\u0430\u044f 30 \u0444\u0440\u0430\u0433.fr3d"}];

var initialCount=Model.Count;
writeReport(base+'model4-full.json', inspectModel(Model, String(Action.ModelFilename)));
var summary=[];
for(var n=0;n<sources.length;n++) {
    var item=sources[n], block=null;
    try {
        block=AddBlock('Reference inspection');
        var loaded=block.Load(item.source);
        if(block.Count===0) throw new Error('Empty load result: '+loaded);
        var report=inspectModel(block,item.name);
        writeReport(base+item.id+'.json',report);
        summary.push({id:item.id,name:item.name,objects:report.objects.length,errors:report.errors.length});
    } catch(e) {summary.push({id:item.id,name:item.name,error:String(e)});}
    finally {if(block) DeleteObject(block);}
    writeReport(base+'batch-summary.json',summary);
}
writeReport(base+'batch-complete.json',{initialCount:initialCount,finalCount:Model.Count,sources:summary});
