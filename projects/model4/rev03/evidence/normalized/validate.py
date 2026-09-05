from pathlib import Path
import json, math
base=Path(__file__).resolve().parent
read=lambda f:json.loads((base/f).read_text(encoding='utf-8'))
baseline=read('r02-baseline.json'); bi={o['path']:o for o in baseline['objects']}
failures=[]; checks=0

def same(a,b,label):
 global checks
 checks+=1
 if isinstance(a,(int,float)) and not isinstance(a,bool):
  ok=isinstance(b,(int,float)) and math.isfinite(b) and abs(a-b)<=0.01
 else:ok=a==b
 if not ok: failures.append({'field':label,'expected':a,'actual':b})

def check_model(m,d,label):
 W,H,D=d; idx={o['path']:o for o in m['objects']}
 same(212,len(idx),label+'.count');same([],m['errors'],label+'.errors')
 panels=[o for o in m['objects'] if o.get('panel')];same(15,len(panels),label+'.panels')
 for o in panels:
  ref=bi[o['path']]
  for k in ['thickness','material','name','article','texture','butts','buttCount','cutCount','plasticsCount','contourCount']:
   same(ref[k],o[k],label+'.'+o['path']+'.'+k)
  same(True,o['contourWidth']>0 and o['contourHeight']>0,label+'.positive.'+o['path'])
 # Independently defined panel dimension chains in source local contour axes.
 expected={
  '1.19':(W-32,80), '1.20':(D-3,H-16), '1.21':(D-3,H-16),
  '1.22':(W,D-3), '1.23':(W-3,H/2-35), '1.24':(W-3,H/2-35),
  '1.25':(W-2,H-52)
 }
 for path,(cw,ch) in expected.items():
  o=idx[path];same(cw,o['contourWidth'],label+'.'+path+'.width');same(ch,o['contourHeight'],label+'.'+path+'.height')
 for path in ['1.26','1.33']:
  o=idx[path];r=bi[path]
  same(W,o['gmax'][0]-o['gmin'][0],label+'.profile.width')
  for a in [1,2]:same(r['gmax'][a]-r['gmin'][a],o['gmax'][a]-o['gmin'][a],label+'.profile.section')
 for path in ['1.23','1.24']:
  o=idx[path];same(1.5,o['gmin'][0],label+'.facade.left');same(W-1.5,o['gmax'][0],label+'.facade.right');same(D-523,o['gmin'][2],label+'.facade.front')
 same(35,idx['1.23']['gmin'][1]-idx['1.24']['gmax'][1],label+'.facade.gap')
 # Drawer panels retain mounting depth and thickness; only transverse widths change.
 for o in panels:
  if o['path'] in expected:continue
  r=bi[o['path']]
  for a in [0,1,2]:
   before=r['gmax'][a]-r['gmin'][a]
   want=before+(W-600 if a==0 and before>100 else 0)
   same(want,o['gmax'][a]-o['gmin'][a],label+'.drawer.'+o['path']+'.size'+str(a))
 # Native rails and fittings keep their own size. Elastic frames/profiles excluded explicitly.
 for o in m['objects']:
  if o['list'] or o.get('panel') or o['name']==bi['1.0']['name'] or o['path'].startswith(('1.26.','1.33.')):continue
  r=bi[o['path']]
  for a in range(3):
   expected=r['gmax'][a]-r['gmin'][a]
   if o['path']=='1.3.9' and a==0:expected=W-164 # Transverse internal drawer front profile.
   if o['path'] in ['1.17.2','1.18.2'] and a==2:expected=D-3 # Joint reference lines, not hardware bodies.
   same(expected,o['gmax'][a]-o['gmin'][a],label+'.hardware.'+o['path']+'.size'+str(a))

for i in range(27):
 t=read('r02-test-'+str(i)+'.json');check_model(t['model'],t['dimensions'],'test'+str(i))
report={'status':'FAIL' if failures else 'PASS','checks':checks,'cases':27,'reopenedResizeCases':0,'failures':failures,'toleranceMm':0.01}
(base/'elastic-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='failures'}));print(json.dumps(failures[:12],ensure_ascii=True))
raise SystemExit(bool(failures))
