# Google OAuth 설정 (Supabase)

> Routiner 패키지: `com.asteroidin8.routiner`  
> Supabase URL: `https://jxtbkupehalukvqxrjad.supabase.co`

## 1. Google Cloud Console

### OAuth 동의 화면 (최초 1회)

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → **OAuth consent screen**
2. User Type: **External** → Create
3. App name: **Routiner**
4. Authorized domains: `supabase.co` 추가
5. Save and Continue로 완료

### Web Client (Supabase Auth에 등록)

1. Credentials → **+ CREATE CREDENTIALS** → OAuth client ID
2. Type: **Web application**
3. Name: `Routiner Web Client`
4. Authorized redirect URIs:

```
https://jxtbkupehalukvqxrjad.supabase.co/auth/v1/callback
```

5. **Client ID** + **Client Secret** 복사

### Android Client (선택 — 네이티브 Google Sign-In 확장 시)

1. Type: **Android**
2. Package: `com.asteroidin8.routiner`
3. SHA-1 (디버그):

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

## 2. Supabase Dashboard

### Auth → Providers → Google

- Enable Google
- Client ID: Web Client ID
- Client Secret: Web Client Secret

### Auth → URL Configuration

| 항목 | 값 |
|------|-----|
| Site URL | `routiner://` |
| Redirect URLs | `routiner://auth/callback`, `exp://**` (Expo Go/dev) |

### SQL Editor

`supabase/migrations/20260613_initial.sql` 내용 실행

### Database → Replication

`routines`, `todos`, `routine_completions`가 Realtime publication에 포함됐는지 확인

## 3. 앱 `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://jxtbkupehalukvqxrjad.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## 4. 아키텍처

- **로컬(AsyncStorage/Zustand)** = 1차 저장, 오프라인 동작
- **Supabase** = 클라우드 백업 + 다기기 Realtime (Phase 1)
- **로그인** = Google 주 / Email OTP 보조
