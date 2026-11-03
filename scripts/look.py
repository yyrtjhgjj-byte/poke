"""公開前の目視確認。dist/draffia.html をPCとスマホ幅で描画し、
コンソールエラー・横はみ出し・計算機の動作を出力し、スクリーンショットを .shots/ に保存する。

使い方: python3 scripts/look.py [--chrome /usr/bin/google-chrome]
"""
import argparse, asyncio, json, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / '.shots'
VIEWS = ['abstract', 'specimen', 'singles', 'doubles', 'training', 'teams', 'lab', 'forecast']


def wrap(src: str) -> str:
    """Artifact公開時のスケルトンを模したラッパー。"""
    return ('<!doctype html><html><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
            '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
            'body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>'
            '</head><body>' + src + '</body></html>')


async def main(chrome):
    SHOTS.mkdir(exist_ok=True)
    preview = SHOTS / 'preview.html'
    preview.write_text(wrap((ROOT / 'dist' / 'draffia.html').read_text()))
    report = {}
    async with async_playwright() as p:
        kw = {'args': ['--no-sandbox']}
        if chrome:
            kw['executable_path'] = chrome
        browser = await p.chromium.launch(**kw)
        for name, w, h, scheme in [('desk-light', 1280, 900, 'light'), ('mob-dark', 390, 844, 'dark')]:
            ctx = await browser.new_context(viewport={'width': w, 'height': h}, color_scheme=scheme)
            page = await ctx.new_page()
            errs = []
            page.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
            page.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
            await page.goto(preview.as_uri())
            await page.wait_for_timeout(600)
            overflow = {}
            for v in VIEWS:
                await page.evaluate(f"location.hash='{v}'")
                await page.wait_for_timeout(150)
                sw, cw = await page.evaluate('[document.documentElement.scrollWidth, document.documentElement.clientWidth]')
                overflow[v] = 'OK' if sw <= cw else f'はみ出し {sw}>{cw}'
                await page.evaluate('window.scrollTo(0,0)')
                await page.screenshot(path=str(SHOTS / f'{name}-{v}.png'))
            await page.evaluate("location.hash='lab'")
            await page.wait_for_timeout(100)
            atk = await page.evaluate("[document.getElementById('o-dmg').textContent, document.getElementById('o-ko').textContent]")
            await page.click('[data-calcmode=def]')
            await page.wait_for_timeout(100)
            dfn = await page.evaluate("[document.getElementById('o-dmg').textContent, document.getElementById('o-ko').textContent]")
            report[name] = {'errors': errs, 'overflow': overflow, 'calc_atk': atk, 'calc_def': dfn}
            await ctx.close()
        await browser.close()
    print(json.dumps(report, ensure_ascii=False, indent=1))
    print(f'スクリーンショット: {SHOTS}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--chrome', default=None, help='Chrome実行ファイル（省略時はPlaywright同梱のChromium）')
    asyncio.run(main(ap.parse_args().chrome))
