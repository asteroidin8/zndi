# zndi 설정 화면 디자인 가이드 v1

> **목표:** 기능 나열이 아니라, 필요한 항목을 빠르게 찾는 공간  
> **레퍼런스:** GitHub Mobile · iOS Settings · Notion · Linear  
> **키워드:** 미니멀 · 여백 · 계층 · 안정감  
> **스택:** `useThemeColors()` · `Card variant="settings"` — Tailwind 이중화 없음

---

## 1. 전체 구조

### 메인 (`app/settings/index.tsx`)

```
설정

계정          카드
환경          카드
데이터        카드
정보          카드

v1.0.0        (카드 밖, 중앙)
```

### 하위 화면

| 경로 | 내용 |
|------|------|
| `settings/profile` | 키 · 체중 · 목표 체중 · 나이 · 성별 |
| `settings/notifications` | 단식 알림바 · 루틴 · 할일 |
| `settings/theme` | 시스템 · 라이트 · 다크 |

---

## 2. 여백

| 항목 | 값 |
|------|-----|
| 화면 좌우 | `paddingHorizontal: 20` |
| 섹션 간 | `marginBottom: 32` |
| 제목 ↔ 카드 | `marginBottom: 12` |
| 카드 내부 | `paddingVertical: 4~8` |

---

## 3. 카드

| 항목 | 값 |
|------|-----|
| radius | `16` |
| 테두리 | `rgba(255,255,255,0.08)` (다크) / `rgba(0,0,0,0.08)` (라이트) |
| 그림자 | 사용 안 함 |
| glow / neon 바 | **설정에서 사용 안 함** |

---

## 4. 섹션 제목

- `fontSize: 13`, `fontWeight: 500`, secondary color
- 짧은 명사: **계정 · 환경 · 데이터 · 정보**
- neon accent bar **금지**

---

## 5. 행

| 유형 | 높이 |
|------|------|
| 기본 | `minHeight: 56` |
| 설명 1줄 | `72` (가능하면 56 유지) |

---

## 6. 설명 텍스트

- 13px, tertiary, **최대 한 줄**
- 예: `설정된 시간에 알려드려요`

---

## 7. 프로필 (미완성)

- **상단 배너 없음**
- **계정** 섹션 `프로필` 행 value `미설정` · tertiary 강조
- 탭 → `settings/profile`

---

## 8. 계정 섹션

| 행 | 비고 |
|----|------|
| 로그인 계정 | value만, chevron 없음 |
| 클라우드 데이터로 덮어쓰기 | **계정 카드 (메인)** — 로그인 계정 아래 |
| 프로필 | `>` → `settings/profile` |
| 로그아웃 | 중립 텍스트 → 확인 다이얼로그에서 destructive |

**프로필 미완성:** 상단 배너 없음 · **계정** 섹션 `프로필` 행 `미설정` 강조

비로그인: Google/이메일 로그인 UI는 **계정 카드 안** (A안 sync 토글 없음)

---

## 9. 환경 섹션

```
테마    다크 >
알림          >
```

---

## 10. 데이터

- 라벨: `데이터 초기화` (빨간색 **금지**)
- 탭 → Alert에서만 destructive

---

## 11. 정보

카드: 이용약관 · 개인정보처리방침 · 문의하기 (`>`)

버전은 카드 밖 하단 12px secondary center

---

## 12. 색상 원칙 (Tier C)

**초록(primary) 사용처:** 토글 ON · 진행률 · 잔디 · 완료 **만**

**설정에서 초록 금지:** border · divider · section accent · 배경 · 본문

---

## 13. 구현 단계

| 단계 | PR | 내용 |
|------|-----|------|
| A | settings-visual-a | neutral border · spacing · neon bar 제거 · destructive 중립 |
| B | settings-structure | 4섹션 · profile/notifications/theme 라우트 |
| C | settings-copy | 설명·footer·task.md 정리 |

---

## 14. 제외

- Tailwind/global.css 이중 테마
- SettingCard 신규 (기존 `SettingSection` + `SettingsList` 확장)
- 클라oud sync 토글
