from pathlib import Path
import json, sys, math

base=Path(__file__).resolve().parents[2]/"rev01/reference"
source=json.loads((base/'model4-full.json').read_text())
native=json.loads((base/'hardware-template.json').read_text())
data=json.loads((base/'panel-data.json').read_text(encoding='utf-8'))
actual_file=Path(sys.argv[1]) if len(sys.argv)>1 else base/'first-run.json'
actual=json.loads(actual_file.read_text())
actual=actual.get('model',actual)
index={o['path']:o for o in actual['objects']}
ni={o['path']:o for o in native['objects']}
removed={}
for p in data['panels']:
    parent,idx=p['path'].rsplit('.',1)
    removed.setdefault(parent,[]).append(int(idx))
def native_path(path):
    parts=path.split('.')
    return '.'.join(str(int(v)-sum(k<int(v) for k in removed.get('.'.join(parts[:i]),[]))) for i,v in enumerate(parts))
mapping={o['path']:native_path(o['path']) for o in source['objects'] if not o.get('panel')}
added={}
for p in data['panels']:
    owner=p['ownerPath']; n=added.get(owner,0); added[owner]=n+1
    mapping[p['path']]=owner+'.'+str(ni[owner]['count']+n)
for path in list(mapping):
    parts=path.split('.')
    if int(parts[0])>=2:
        mapping[path]='1.'+str(26+int(parts[0])-2)+('.'+'.'.join(parts[1:]) if len(parts)>1 else '')
failures=[]; max_delta=0; checked=0
def compare(a,b,path):
    global max_delta,checked
    checked+=1
    if isinstance(a,(int,float)) and not isinstance(a,bool) and isinstance(b,(int,float)):
        delta=abs(a-b)
        if math.isfinite(delta): max_delta=max(max_delta,delta)
        if not math.isfinite(delta) or delta>0.01:failures.append({'field':path,'expected':a,'actual':b})
    elif isinstance(a,dict) and isinstance(b,dict):
        for k,v in a.items():
            if k!='path' and not (path=='1' and k=='count'):compare(v,b.get(k),path+'.'+k)
    elif isinstance(a,list) and isinstance(b,list):
        if len(a)!=len(b):failures.append({'field':path,'expectedLength':len(a),'actualLength':len(b)})
        else:
            for i,(x,y) in enumerate(zip(a,b)):compare(x,y,path+'.'+str(i))
    elif a!=b:failures.append({'field':path,'expected':a,'actual':b})
if len(source['objects'])!=len(actual['objects']): failures.append({'field':'objectCount'})
for o in source['objects']:
    target=mapping[o['path']]
    if target not in index:failures.append({'field':o['path'],'missingPath':target})
    else:compare(o,index[target],o['path'])
report={'source': 'model4-full.json','actual':actual_file.name,'sourceObjects':len(source['objects']),'actualObjects':len(actual['objects']),'panels':len(data['panels']),'checkedValues':checked,'numericToleranceMm':0.01,'maximumNumericDelta':max_delta,'failures':failures,'status':'PASS' if not failures else 'FAIL','scope':'Exported object hierarchy, transforms, bounding boxes, panel contours, materials, texture orientation, edge properties; no manufacturing approval.'}
out=actual_file.parent/(actual_file.stem+'-comparison.json')
out.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='failures'},ensure_ascii=True))
print(json.dumps(failures[:10],ensure_ascii=True))
sys.exit(bool(failures))
