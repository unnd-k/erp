# 스튜디오언네임드 프로젝트 관리 앱 (React)

React + Vite + Supabase로 만든 프로젝트 관리 웹 앱입니다.

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env.example`을 복사해서 `.env` 파일을 만들어주세요.
```bash
cp .env.example .env
```
그리고 `.env` 파일 안에 Supabase URL과 키를 입력하세요.

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173` 열면 됩니다.

### 4. 배포용 빌드
```bash
npm run build
```
`dist/` 폴더가 생성되고, 이걸 Vercel에 배포하면 됩니다.

## 파일 구조

```
src/
├── main.jsx              # 앱 진입점
├── App.jsx               # 메인 컴포넌트 (라우팅, 상태관리)
├── index.css             # 전체 스타일
├── lib/
│   ├── supabase.js       # Supabase 클라이언트
│   └── utils.js          # 유틸 함수, 아이콘 목록
└── components/
    ├── AuthScreen.jsx    # 로그인/회원가입 화면
    ├── ProjectCard.jsx   # 프로젝트 카드 컴포넌트
    ├── ProjectDetail.jsx # 프로젝트 상세 모달
    ├── ProjectForm.jsx   # 프로젝트 등록/수정 폼
    ├── CategoryModal.jsx # 카테고리 관리 모달
    ├── CalendarView.jsx  # 캘린더 뷰
    └── StatsView.jsx     # 통계 뷰
```

## 기술 스택

- React 18
- Vite
- Supabase (인증 + DB)
- FontAwesome 6.4.0
- Wanted Sans 폰트
