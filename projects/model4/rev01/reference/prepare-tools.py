from pathlib import Path
import json

base = Path(__file__).resolve().parent
source = (base / 'export-current.js').read_text(encoding='ascii')
body = source[source.index('    var result ='):source.index('    var text =')]
body = body.replace('String(Action.ModelFilename)', 'filename').replace('Model.Count', 'list.Count').replace('Model.Objects', 'list.Objects')
inspect = 'function inspectModel(list, filename) {\n' + body + '    return result;\n}\n'
inspect += "function writeReport(path, data) { system.writeTextFile(path, JSON.stringify(data,null,2).replace(/[\\u0080-\\uffff]/g,function(c){return '\\\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4);})); }\n"
(base/'inspect-model.js').write_text(inspect, encoding='ascii')
remote = 'C:\\Users\\Денис\\Documents\\Codex\\model4-r01\\'
files = sorted((base/'Модели').glob('*'))
files = [p for p in files if p.suffix.lower() in ('.b3d','.fr3d')]
manifest = [{'id':f'ref-{i+1:02}', 'name':p.name, 'source':'C:\\Users\\Денис\\Desktop\\Модели\\'+p.name} for i,p in enumerate(files)]
(base/'reference-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
batch = inspect + '\nvar base=' + json.dumps(remote) + ';\nvar sources='+json.dumps(manifest)+';\n'
batch += '''
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
'''
(base/'inspect-batch.js').write_text(batch,encoding='ascii')
