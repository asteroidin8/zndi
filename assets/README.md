# Assets (스토어 제출용)

| 파일 | 크기 | 용도 |
|------|------|------|
| `icon.png` | 1024×1024 | iOS/Android 앱 아이콘 |
| `splash-icon.png` | 512×512 | 스플래시 중앙 로고 |
| `android-icon-foreground.png` | 1024×1024 | Android adaptive foreground |
| `android-icon-background.png` | 1024×1024 | Android adaptive background (#E6F4FE) |
| `android-icon-monochrome.png` | 1024×1024 | Android 13+ monochrome |
| `favicon.png` | 48×48 | Web favicon |

브랜드 마크: `#0a0a0a` 원형 + **R** (Segoe UI Bold). 재생성:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-assets.ps1
```

`app.json`의 `splash.backgroundColor`는 `#ffffff` 기준입니다.
