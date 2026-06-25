-- ============================================================
-- 1. 관리자 역할 서버 관리
--    profiles 테이블에 role 컬럼 추가 + is_admin RPC
-- ============================================================

-- role 컬럼 추가 (기존 사용자는 'user')
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- 현재 관리자 설정
UPDATE profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'asteroidin8@gmail.com'
);

-- RPC: 현재 사용자가 관리자인지 확인
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- RPC: 현재 사용자의 Pro 상태 조회 (role 기반)
-- 향후 subscriptions 테이블 연동 시 이 함수를 확장
CREATE OR REPLACE FUNCTION get_pro_status()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'is_pro', COALESCE(
      (SELECT role = 'admin' FROM profiles WHERE user_id = auth.uid()),
      false
    ),
    'source', CASE
      WHEN (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin' THEN 'admin'
      ELSE 'free'
    END
  );
$$;
