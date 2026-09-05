// Read-only model inspection. No model mutation.
(function () {
    var result = {schema: 3, apiVersion: system.apiVersion, filename: String(Action.ModelFilename), rootCount: Model.Count, objects: [], errors: []};
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
    for (var i = 0; i < Model.Count; i++) walk(Model.Objects[i], String(i));
    var text = JSON.stringify(result, null, 2).replace(/[\u0080-\uffff]/g, function(c) { return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4); });
    system.writeTextFile('C:\\Users\\\u0414\u0435\u043d\u0438\u0441\\Documents\\Codex\\model4-r01\\current-model.json', text);
}());
