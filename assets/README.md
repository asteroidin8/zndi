# Assets (스토어 제출용)

| 파일 | 크기 | 용도 |
|------|------|------|
| `zndi-icon-source.png` | 원본 | 브랜드 마스터 (네온 잔디 심볼) |
| `icon.png` | 1024×1024 | iOS/Android 앱 아이콘 |
| `splash-icon.png` | 512×512 | 스플래시 중앙 로고 |
| `android-icon-foreground.png` | 1024×1024 | Android adaptive foreground |
| `android-icon-background.png` | 1024×1024 | Adaptive 배경 `#121212` |
| `android-icon-monochrome.png` | 1024×1024 | Android 13+ monochrome |
| `favicon.png` | 48×48 | Web favicon |

## 재생성

원본(`zndi-icon-source.png`) 교체 후:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/import-zndi-icon.ps1
```

`app.json`: adaptive `backgroundColor` · splash `#121212` · 알림 accent `#22C55E`
