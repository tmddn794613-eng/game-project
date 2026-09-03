# 로그스토리 도트 전투 자산

이번 전환에서는 기존 게임 로직을 유지하고 전투 화면의 이모지 캐릭터를 작고 아기자기한 16비트 JRPG풍 chibi 투명 PNG로 교체한다. 원본 파일은 `/home/ubuntu/webdev-static-assets/`에 보관하며, 게임 코드에서는 WebDev 수명주기 URL을 직접 참조한다.

| 자산 | 사용 위치 | URL |
|---|---|---|
| 생존자 플레이어 | 전투 화면 왼쪽 | `/manus-storage/logstory-chibi-citizen-alpha_e4b10c87.png` |
| 먼지괴물·일반 변이체 | 일반 몬스터 기본값 | `/manus-storage/logstory-chibi-mutant-alpha_f45f813f.png` |
| 들쥐떼 | 작은 설치류 무리 | `/manus-storage/logstory-chibi-rat-swarm-alpha_c3ae93bb.png` |
| 변이견 | 개과 변이 몬스터 | `/manus-storage/logstory-chibi-hound-alpha_c4805d2b.png` |
| 파수꾼·저격수·골렘 계열 | 갑주형 몬스터 | `/manus-storage/logstory-chibi-raider-alpha_cb288551.png` |
| 지역 보스 | 보스 전투 | `/manus-storage/logstory-chibi-boss-alpha_4b00f388.png` |

스타일 기준은 어두운 폐허 생존 RPG의 작고 아기자기한 16비트 JRPG풍 chibi 도트 표현이며, 투명 배경·픽셀 가장자리·차콜/녹슨 금속/앰버 신호색을 사용한다. 캐릭터 이미지는 CSS `image-rendering: pixelated`로 표시하고, Web Animations API로 공격 돌진과 피격 반동을 재생한다.

## 1차 전직 도트 캐릭터

참고 이미지의 단순한 16비트 도트 감성을 바탕으로, 로그스토리의 현대 생존 세계관에 맞춘 투명 캐릭터 자산을 추가했습니다. 일반시민은 후드와 배낭, 현장직원은 안전조끼와 안전모, 도둑은 민첩한 수색복과 가방, 마술사는 현대식 무대 재킷과 작은 모자로 구분합니다.

- 일반시민: `/manus-storage/logstory-job-citizen-cutout_18a8687b.png`
- 현장직원: `/manus-storage/logstory-job-field-worker-cutout_01cc1978.png`
- 도둑: `/manus-storage/logstory-job-thief-cutout_2db69c38.png`
- 마술사: `/manus-storage/logstory-job-magician-cutout_94e2b754.png`

## 2026-09-03 첫 화면 배경

- 첫 화면 전용 배경: `/manus-storage/logstory-intro-red-moon-bg_4243adcb.png`
- 사용 범위: 새 게임·이어하기가 표시되는 intro 화면에만 적용
- 특징: 붉은 달, 파괴된 빌딩 숲, 앰버 비상등, 모바일 세로 화면용 중앙 하단 텍스트 안전 영역

## 2026-09-02 인트로·마을 음악

- 제공 배경 음악: `/manus-storage/lexin_music-inspiring-cinematic-ambient-116199_0526eb61.mp3`
- 재생 범위: 인트로(`새 게임·이어하기`)와 캠프(`home`) 화면
- 정지 범위: 월드맵·던전 허브·전투 화면

## 2026-09-02 첫 번째 던전 오디오

- 첫 번째 던전 배경 음악: `/manus-storage/logstory-dungeon-01-bgm_bc61cf41.mp3`
- 재생 범위: 첫 번째 지역의 던전 허브(`dungeon`)와 전투(`battle`)
- 특징: 약 113초 반복용 오리지널 인스트루멘털 탐색곡
- 효과음: 별도 대용량 파일 대신 브라우저 Web Audio API로 UI 터치·타격·피격의 짧은 합성음을 재생해 오프라인 자산 부담을 줄임

## 2026-09-02 첫 번째 던전 전투 배경

- 첫 번째 던전 전투 배경: `/manus-storage/logstory-dungeon-01-battle-bg_92f4b225.png`
- 사용 범위: 첫 번째 던전 전투 무대의 배경 이미지
- 특징: 붉은 달, 파괴된 빌딩 숲, 폐허 마을 외곽, 어두운 전투 가독성 오버레이를 포함한 16:9 16비트 픽셀 아트
- 전투 스프라이트: 캐릭터·몬스터 발밑에 `.sprite-shadow` 타원형 그림자를 추가해 접지감을 보완

## 캐릭터 투명 처리 보완

직업 스프라이트는 cutout 자산을 사용하며, 브라우저에서 가장자리의 흰색·회색 배경 픽셀을 경계 기준으로 제거한 뒤 캔버스로 렌더링합니다. 이중 처리로 전투와 전직 미리보기 모두 흰색 사각형이 보이지 않도록 했습니다.
