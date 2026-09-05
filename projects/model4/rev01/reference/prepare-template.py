from pathlib import Path
import json

base=Path(__file__).resolve().parent
m=json.loads((base/'model4-full.json').read_text(encoding='utf-8'))
assert not m['errors'], m['errors']
panels=[o for o in m['objects'] if o.get('panel')]
assert len(panels)==15
for p in panels:
    assert p['cutCount']==p['plasticsCount']==0
    assert len(p['contour'])==p['contourCount']
    assert len(p['butts'])==p['buttCount']
    assert all(b['profile'] is None or b['profile']==[] for b in p['butts'])
removed={}
for p in panels:
    parent,idx=p['path'].rsplit('.',1)
    removed.setdefault(parent,[]).append(int(idx))
for p in panels:
    parts=p['path'].split('.')[:-1]
    p['ownerPath']='.'.join(str(int(v)-sum(k<int(v) for k in removed.get('.'.join(parts[:i]),[]))) for i,v in enumerate(parts))
data={'revision':'01','sourceObjects':len(m['objects']),'nativeObjects':len(m['objects'])-len(panels),'panels':panels}
(base/'panel-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
remote='C:\\Users\\Денис\\Documents\\Codex\\model4-r01\\'
script=(base/'inspect-model.js').read_text(encoding='ascii')+'\nvar base='+json.dumps(remote)+';\n'
script+='var paths='+json.dumps([p['path'] for p in panels])+';\n'
script+='''
function resolve(path){var o=Model, parts=path.split('.'); for(var i=0;i<parts.length;i++)o=o.Objects[Number(parts[i])]; return o;}
var before=inspectModel(Model,String(Action.ModelFilename));
if(before.objects.length!==212 || before.errors.length) throw new Error('Unexpected source model');
if(String(Action.ModelFilename).indexOf('source-model4.b3d')<0) throw new Error('Use working source-model4 copy');
var refs=[];
for(var i=0;i<paths.length;i++){var o=resolve(paths[i]); if(!o.Butts)throw new Error('Not a panel: '+paths[i]); refs.push(o);}
Undo.RecursiveChanging(Model);
for(var i=0;i<refs.length;i++)DeleteObject(refs[i]);
var after=inspectModel(Model,'hardware-template.b3d');
if(after.objects.length!==197)throw new Error('Unexpected native object count');
Action.SaveModel(base+'hardware-template.b3d');
writeReport(base+'hardware-template.json',after);
writeReport(base+'template-complete.json',{removedPanels:refs.length,nativeObjects:after.objects.length,fileExists:system.fileExists(base+'hardware-template.b3d')});
'''
(base/'extract-template.js').write_text(script,encoding='ascii')
