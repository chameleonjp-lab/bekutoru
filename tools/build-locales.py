#!/usr/bin/env python3
"""Validate explicit catalogs and embed the public data in the single-page release."""
import argparse,collections,json,pathlib,re
root=pathlib.Path(__file__).resolve().parents[1]
langs=['ja','en','es','pt-BR','zh-Hans','fr','de','ko','ru','it','zh-Hant','id','tr','vi','th']
source=json.loads((root/'i18n/source.json').read_text()); catalogs={}
for lang in langs:
 values=json.loads((root/f'i18n/{lang}.json').read_text())
 assert len(values)==len(source),(lang,'missing entries')
 for i,(key,value) in enumerate(zip(source,values)):
  assert isinstance(value,str) and value.strip(),(lang,i,'blank')
  assert collections.Counter(re.findall(r'\{\d+\}',key))==collections.Counter(re.findall(r'\{\d+\}',value)),(lang,i,'placeholders')
 catalogs[lang]=values
payload=json.dumps({'source':source,'catalogs':catalogs},ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
p=root/'index.html';html=p.read_text();new=re.sub(r'(<script id="localeData" type="application/json">)[\s\S]*?(</script>)',lambda m:m[1]+payload+m[2],html)
assert new!=html or payload in html,'missing localeData block'
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
if args.check:assert html==new,'catalogs changed; run python3 tools/build-locales.py'
else:p.write_text(new)
print(f'{len(langs)} complete catalogs × {len(source)} entries; embedded release matches')
