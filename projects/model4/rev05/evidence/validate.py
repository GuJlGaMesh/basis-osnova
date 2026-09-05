import json, math
from pathlib import Path
HERE=Path(__file__).resolve().parent
checks=0
def read(p): return json.loads(p.read_text(encoding="utf-8-sig"))
def equal(a,b,path=""):
 global checks
 checks+=1
 if isinstance(a,(int,float)) and not isinstance(a,bool) and isinstance(b,(int,float)):
  assert math.isclose(a,b,abs_tol=0.01,rel_tol=0), (path,a,b)
 elif isinstance(a,dict):
  assert a.keys()==b.keys(),(path,a.keys(),b.keys())
  for k in a:equal(a[k],b[k],path+"/"+k)
 elif isinstance(a,list):
  assert len(a)==len(b),(path,len(a),len(b))
  for i,(x,y) in enumerate(zip(a,b)):equal(x,y,path+"/"+str(i))
 else:assert a==b,(path,a,b)
def core_map(d,root):
 return {o["path"][len(root):]:o for o in d["objects"] if o["path"]==root or o["path"].startswith(root+".")}
refs={tuple((d:=read(f))["dimensions"]):d["model"] for f in (HERE.parents[1]/"rev03/evidence").glob("r03-test-*.json")}
seed=read(HERE/"r05-scene-before.json")
for n in range(27):
 case=read(HERE/f"r05-grid-{n}.json");d=case["model"];assert not d["errors"]
 r=str(d["rootCount"]-1);a=core_map(refs[tuple(case["dimensions"])],"1");b=core_map(d,r)
 assert len(a)==len(b)==211
 offset=[b[".3"]["gmin"][i]-a[".3"]["gmin"][i] for i in range(3)]
 for k,v in a.items():
  left={x:y for x,y in v.items() if x!="path"};right={x:y for x,y in b[k].items() if x!="path"}
  for field in ["gmin","gmax","origin"]:
   if field in right:right[field]=[right[field][i]-offset[i] for i in range(3)]
  equal(left,right,f"case{n}{k}")
 prior=[o for o in d["objects"] if not(o["path"]==r or o["path"].startswith(r+"."))]
 equal(seed["objects"],prior,f"seed{n}")
added=read(HERE/"r05-scene-added.json");opened=read(HERE/"r05-scene-reopened.json");equal(added,opened,"reload")
roots=[o["path"] for o in added["objects"] if "." not in o["path"] and o.get("list")]
assert len(roots)==2
panels=[[o for o in added["objects"] if o.get("panel") and o["path"].startswith(r+".")] for r in roots]
assert all(len(p)==15 for p in panels)
gap=min(o["gmin"][0] for o in panels[1])-max(o["gmax"][0] for o in panels[0]);assert abs(gap)<0.01
faces=[max(o["gmax"][2] for o in p if abs(o["axisZ"][2])>.99) for p in panels];assert abs(faces[0]-faces[1])<0.01
assert len(read(HERE/"r05-selection-check.json")["panels"])==30
result={"status":"PASS","cases":27,"checks":checks,"objectsPerModule":211,"panelsPerModule":15,"existingObjectsPreserved":True,"saveReopenEqual":True,"sideGapMm":gap,"frontPlanes":faces,"apiPanelSelections":30}
(HERE/"validation.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
print(json.dumps(result))
