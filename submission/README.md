# 제출용 실행 자료

이 폴더는 하나루프 프론트엔드 채용 과제 제출 시 함께 확인할 수 있는 실행 화면 자료입니다.

| 파일 | 설명 |
| --- | --- |
| `desktop-dashboard.png` | `next start` 프로덕션 서버에서 촬영한 데스크톱 대시보드 화면 |
| `mobile-dashboard.png` | 모바일 뷰포트에서 촬영한 반응형 대시보드 화면 |
| `rollback-error-state.png` | fake backend 저장 실패 시 optimistic rollback 메시지가 표시되는 상태 |

캡처 기준:

- 실행: `npm run build` 후 `npm run start -- --hostname 127.0.0.1 --port 3012`
- 브라우저: Playwright Chromium
- 확인 항목: navigation drawer, 한국어 KPI `$63,575`, 모바일 레이아웃, 저장 실패 rollback 메시지
