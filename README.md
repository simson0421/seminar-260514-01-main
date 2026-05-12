# seminar-260514-01-main

# 🪜 사다리 타기 게임 AI 협업 개발 상세 리포트

본 문서는 AI와 협업하여 사다리 타기 게임의 로직을 단계별로 구체화하고, 기능을 확장해 나간 전체 과정을 정리한 문서입니다.

## 1. Phase 1: 기본 구조 설계 및 동적 생성

사다리 게임의 가장 기초가 되는 기둥과 가로선의 데이터 모델을 정의하고 화면에 그리는 단계입니다.

* **질문**: "HTML, CSS, jQuery를 이용해 사다리 타기 게임을 만들어줘. 인원수에 따라 선이 자동으로 생성되어야 해."
* **답변**: Canvas API를 사용하여 인원수에 비례한 `gap`을 계산하고, `ladders` 배열에 랜덤한 가로 다리 좌표를 저장하는 방식을 제안합니다.
* **해결**:
* 인원수에 맞춰 HTML `input`과 `canvas` 크기를 동적으로 조절합니다.
* `setInterval`을 활용해 선이 위에서 아래로 내려오는 애니메이션 기초를 마련합니다.



```javascript
// [코드] 인원수에 따른 캔버스 초기화 및 기초 사다리 드로잉
function init() {
    playerCount = parseInt($('#playerCount').val());
    canvas.width = 600; 
    gap = (canvas.width - (padX * 2)) / (playerCount - 1); // 기둥 간격 계산
    
    // 세로 기둥 그리기
    for (let i = 0; i < playerCount; i++) {
        let x = padX + (i * gap);
        ctx.moveTo(x, padY);
        ctx.lineTo(x, cHeight - padY);
    }
    // 랜덤 가로 다리 데이터 생성
    ladders.push({ xIdx: i, y: Math.random() * cHeight }); 
}

```

---

## 2. Phase 2: 데이터 중심 설계 및 객체화

하드코딩된 로직에서 벗어나 외부에서 데이터를 직접 제어할 수 있도록 구조를 리팩토링하는 단계입니다.

* **질문**: "선 위치를 내가 JS 파일에서 조정할 수 있게 만들고, 개발자 도구(Console)에서도 수정 가능하게 해줘."
* **답변**: 모든 설정과 데이터를 `window.ladder` 전역 객체로 통합하여 외부 접근성을 높이는 구조를 제안합니다.
* **해결**:
* 픽셀 단위가 아닌 **비율(0~1)** 기반의 `height` 데이터를 도입하여 해상도 변화에 대응합니다.
* `ladder.init()` 함수를 호출하여 콘솔에서 실시간으로 설정을 갱신합니다.



```javascript
// [코드] 전역 제어 객체(window.ladder) 구조
window.ladder = {
    playerCount: 3,
    data: [ // 비율 기반 데이터 구조
        { section: 0, height: 0.3 }, 
        { section: 1, height: 0.5 }
    ],
    config: { colWidth: 200, padding: 50 },
    init: function() {
        // 설정 변경 시 캔버스 및 버튼 재호출 로직
        refreshCanvas();
        createButtons();
    }
};

```

---

## 3. Phase 3: 대각선 이동 로직 및 벡터 애니메이션

수평 이동의 단조로움을 깨고 대각선(사선) 이동을 가능하게 하여 게임성을 높인 단계입니다.

* **질문**: "가로선 이동 대신 대각선으로 부드럽게 이동하게 만들어줘. 선이 꺾이지 않았으면 좋겠어."
* **답변**: 시작점과 끝점의 높이를 다르게 설정하고, 삼각함수를 이용한 벡터(Vector) 이동 방식을 제안합니다.
* **해결**:
* 데이터 구조 확장: `height`(시작 비율)와 `endHeight`(도착 비율)를 분리합니다.
* 피타고라스 정리를 이용해 $X, Y$ 축 속도를 분리 계산하여 일정한 속도로 사선 이동을 구현합니다.



```javascript
// [코드] 벡터 기반 대각선 이동 애니메이션 핵심
function moveSegment(start, end, color) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy); // 두 지점 사이의 직선 거리
    
    const speed = 10;
    const velX = (dx / distance) * speed; // 프레임당 X 이동량
    const velY = (dy / distance) * speed; // 프레임당 Y 이동량

    const step = () => {
        curX += velX;
        curY += velY;
        ctx.lineTo(curX, curY);
        ctx.stroke();
        // 목적지 도착 시 resolve(), 아니면 requestAnimationFrame(step)
    };
}

```

---

## 4. Phase 4: 최종 결과 도출 및 데이터 추출

플레이어가 어디에 도착했는지 정확한 인덱스 값을 계산하여 시스템적으로 활용하는 단계입니다.

* **질문**: "플레이어가 도착한 기둥의 인덱스 번호를 콘솔로 확인하고 싶어."
* **답변**: 경로(`path`) 데이터의 마지막 좌표값에서 설정된 `padding`과 `colWidth`를 이용해 인덱스를 역산하는 공식을 제안합니다.
* **해결**:
* 공식: $index = (finalX - padding) / colWidth$
* 개별 플레이 완료 시와 '전체 결과 확인' 클릭 시 각각 로그가 출력되도록 구현합니다.



```javascript
// [코드] 도착 기둥 인덱스 역산 및 출력 로직
async function animatePath(playerIdx, path, color) {
    await moveSegment(...); // 이동 완료 대기

    // 최종 좌표를 기반으로 인덱스 계산
    const finalX = path[path.length - 1].x;
    const arrivalIdx = (finalX - ladder.config.padding) / ladder.config.colWidth;
    
    console.log(`[결과] 플레이어 ${playerIdx + 1} → ${arrivalIdx}번 인덱스 기둥 도착`);
}

```

---

**추가 확인 사항:**

1. 위 단계별 코드 중 특정 수식(예: 벡터 계산)에 대해 더 자세한 수학적 설명이 필요하신가요?
2. 결과값을 콘솔이 아닌 화면에 레이어나 팝업으로 띄우는 UI 코드를 추가해 드릴까요?
3. 캔버스 배경에 사용자 이미지를 넣거나 테마를 변경하는 디자인 가이드가 필요하신가요?