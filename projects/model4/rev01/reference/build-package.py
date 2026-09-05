from pathlib import Path
import json, shutil

base=Path(__file__).resolve().parent
src=base.parent/'src'
(src/'lib').mkdir(parents=True,exist_ok=True)
data=json.loads((base/'panel-data.json').read_text(encoding='utf-8'))
js='// Model4 reproduction, revision 01. Full replacement of the active model.\nvar DATA='+json.dumps(data,ensure_ascii=True,separators=(',',':'))+';\n'
js+=(base/'inspect-model.js').read_text(encoding='ascii')
js+=(base/'generator-body.js').read_text(encoding='ascii')
(src/'model4.js').write_text(js,encoding='ascii')
shutil.copyfile(base/'hardware-template.b3d',src/'lib/hardware-template.b3d')
remote='C:\\Users\\Денис\\Documents\\Codex\\model4-r01\\generated-model4.b3d'
(base/'test-run.js').write_text('var MODEL4_AUTOTEST='+json.dumps(remote)+';\n'+js,encoding='ascii')
repeat='var MODEL4_AUTOTEST='+json.dumps(remote)+';\n'+js
remote_base=remote.rsplit('\\',1)[0]+'\\'
repeat+='\nwriteReport('+json.dumps(remote_base+'repeat-run.json')+',JSON.parse(system.readTextFile("model4-last-run.json")));\n'
repeat+='var reopened=Action.LoadModel('+json.dumps(remote)+');\nwriteReport('+json.dumps(remote_base+'reopened.json')+',inspectModel(Model,String(Action.ModelFilename)));\n'
(base/'repeat-and-reopen.js').write_text(repeat,encoding='ascii')
