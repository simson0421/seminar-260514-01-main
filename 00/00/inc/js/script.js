function contentScript(_idx, _content) {
    contentsIdx = _idx;
    contents = _content;

    switch (contentsIdx) {
        case 0:
            // 캔버스 엘리먼트 획득 및 그리기 도구(ctx) 준비
            const canvas = document.getElementById('ladderCanvas');
            const ctx = canvas.getContext('2d');

            // --- [설정 데이터] ---
            const playerCount = 3; // 사다리 세로 줄의 개수
            const ladderData = [   // 가로 다리의 위치 정보 (section: 시작 기둥 번호, height: 높이 비율 0~1)
                { section: 0, height: 0.3 }, // 0번-1번 기둥 사이 30% 높이
                { section: 0, height: 0.5 },
                { section: 0, height: 0.7 },
                { section: 1, height: 0.1 }, // 1번-2번 기둥 사이 10% 높이
                { section: 1, height: 0.4 },
                { section: 1, height: 0.6 },
                { section: 1, height: 0.8 },
            ];

            const padding = 50;        // 캔버스 안쪽 여백 (상하좌우)
            const colWidth = 500;      // 기둥과 기둥 사이의 가로 간격
            const canvasHeight = 300;  // 캔버스 전체 높이
            const innerHeight = canvasHeight - (padding * 2); // 실제 사다리가 그려지는 유효 높이
            const colors = ['#E91E63', '#9C27B0', '#2196F3', '#4CAF50', '#FFC107']; // 플레이어별 고유 색상

            let activeAnimation = null; // 현재 실행 중인 requestAnimationFrame을 취소하기 위한 변수
            let drawnPaths = [];       // 이미 완료된 경로 데이터를 저장하여 누적 표시하기 위한 배열

            // 설정된 인원과 간격에 맞춰 캔버스 너비와 높이 지정
            canvas.width = (playerCount - 1) * colWidth + padding * 2;
            canvas.height = canvasHeight;

            /**
             * 배경 사다리판과 이미 그려진 경로들을 화면에 다시 그리는 함수
             */
            function refreshCanvas() {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 전체를 투명하게 지움
                ctx.lineCap = 'round';  // 선의 끝 모양을 둥글게 설정
                ctx.lineJoin = 'round'; // 선이 꺾이는 지점을 둥글게 설정

                // 1. 기본 배경 사다리(회색) 그리기
                ctx.strokeStyle = '#eee';
                ctx.lineWidth = 5;
                for (let i = 0; i < playerCount; i++) {
                    const x = padding + i * colWidth;
                    ctx.beginPath(); 
                    ctx.moveTo(x, padding); // 기둥 시작점
                    ctx.lineTo(x, canvas.height - padding); // 기둥 끝점
                    ctx.stroke();
                }
                // 배경 가로 다리 그리기
                ladderData.forEach(line => {
                    const x = padding + (line.section * colWidth);
                    const y = padding + (line.height * innerHeight);
                    ctx.beginPath(); 
                    ctx.moveTo(x, y); 
                    ctx.lineTo(x + colWidth, y); 
                    ctx.stroke();
                });

                // 2. 이미 완료된 경로들 다시 그리기 (누적 효과의 핵심)
                drawnPaths.forEach(p => {
                    drawPathInstant(p.path, p.color);
                });
            }

            /**
             * 특정 시작 지점으로부터 바닥까지의 전체 경로 좌표 배열을 계산하는 함수
             * @param {number} startIdx - 시작하는 플레이어의 인덱스 (0, 1, 2...)
             * @returns {Array} 좌표 객체 {x, y}의 배열
             */
            function getPath(startIdx) {
                let curIdx = startIdx; // 현재 위치한 기둥 번호
                let curY = padding;    // 현재 Y 좌표
                const path = [{ x: curIdx * colWidth + padding, y: curY }]; // 경로 기록 시작점
                const sortedLines = [...ladderData].sort((a, b) => a.height - b.height); // 높이순으로 가로선 정렬

                while (curY < canvasHeight - padding) {
                    // 현재 위치 아래에 있는 가로선 중 내 기둥과 연결된 가장 가까운 선 찾기
                    const nextBridge = sortedLines.find(line =>
                        line.height * innerHeight + padding > curY + 1 &&
                        (line.section === curIdx || line.section === curIdx - 1)
                    );

                    if (nextBridge) {
                        const bridgeY = nextBridge.height * innerHeight + padding;
                        // 가로선 지점까지 수직 이동 좌표 추가
                        path.push({ x: curIdx * colWidth + padding, y: bridgeY });
                        // 가로선을 타고 옆 기둥으로 이동 (Idx 변경)
                        curIdx = (nextBridge.section === curIdx) ? curIdx + 1 : curIdx - 1;
                        // 옆 기둥의 같은 높이 좌표 추가
                        path.push({ x: curIdx * colWidth + padding, y: bridgeY });
                        curY = bridgeY; // 현재 높이 갱신
                    } else {
                        // 더 이상 가로선이 없으면 바닥까지 직선 이동 좌표 추가
                        path.push({ x: curIdx * colWidth + padding, y: canvasHeight - padding });
                        curY = canvasHeight - padding;
                    }
                }
                return path;
            }

            /**
             * 전체 경로 배열을 받아 한 마디씩 애니메이션으로 그리는 함수
             * @param {number} playerIdx - 플레이어 번호
             * @param {Array} path - getPath로 계산된 좌표 배열
             * @param {string} color - 선의 색상
             */
            async function animatePath(playerIdx, path, color) {
                for (let i = 0; i < path.length - 1; i++) {
                    // 경로의 i번째 지점에서 i+1번째 지점까지 이동하며 그리기 (순차적 실행)
                    await moveSegment(path[i], path[i + 1], color);
                }
                // 모든 마디가 그려지면 누적 배열에 저장
                drawnPaths.push({ path, color });
                setTimeout(() => {
                    console.log(`${playerIdx + 1}번 플레이어 도착!`);
                }, 100);
            }

            /**
             * 두 지점(start -> end) 사이를 부드럽게 연결하는 애니메이션 함수
             * @param {Object} start - 시작 좌표 {x, y}
             * @param {Object} end - 종료 좌표 {x, y}
             * @param {string} color - 선 색상
             */
            function moveSegment(start, end, color) {
                return new Promise(resolve => {
                    let curX = start.x;
                    let curY = start.y;
                    const speed = 10; // 한번 프레임당 이동할 픽셀 수

                    const step = () => {
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 6;
                        ctx.moveTo(curX, curY);

                        // 가로 이동 (x값이 다를 때)
                        if (start.x !== end.x) {
                            if (Math.abs(curX - end.x) < speed) curX = end.x;
                            else curX += (end.x > start.x ? speed : -speed);
                        }
                        // 세로 이동 (y값이 다를 때)
                        if (start.y !== end.y) {
                            if (Math.abs(curY - end.y) < speed) curY = end.y;
                            else curY += speed;
                        }

                        ctx.lineTo(curX, curY);
                        ctx.stroke();

                        // 목적지에 도달했는지 확인
                        if (curX === end.x && curY === end.y) {
                            resolve(); // Promise 완료 (다음 마디로 넘어감)
                        } else {
                            activeAnimation = requestAnimationFrame(step); // 다음 프레임 실행
                        }
                    };
                    step();
                });
            }

            /**
             * 애니메이션 없이 경로를 즉시 그리는 함수
             */
            function drawPathInstant(path, color) {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 5;
                ctx.moveTo(path[0].x, path[0].y);
                path.forEach(pt => ctx.lineTo(pt.x, pt.y)); // 모든 좌표를 곧바로 연결
                ctx.stroke();
            }

            // 플레이어 개별 버튼 생성 및 클릭 이벤트 바인딩
            const $btnWrapper = $('#playerButtons').empty();
            for (let i = 0; i < playerCount; i++) {
                $('<button>').addClass('p-btn').text(i + 1)
                    .on('click', function () {
                        // 이미 그려진 플레이어는 다시 클릭 안 되게 방지
                        if (drawnPaths.some(p => p.color === colors[i % colors.length])) return;

                        $(this).addClass('active').prop('disabled', true);
                        animatePath(i, getPath(i), colors[i % colors.length]); // 애니메이션 시작
                    })
                    .appendTo($btnWrapper);
            }

            // [전체 결과 확인 / 다시 하기] 토글 버튼 이벤트
            $('#toggleBtn').on('click', function () {
                const status = $(this).data('status');
                if (status === 'ready') {
                    $(this).text('다시 하기').data('status', 'reset');
                    drawnPaths = []; // 기존 기록 비우고
                    for (let i = 0; i < playerCount; i++) {
                        // 모든 플레이어 경로를 계산해서 누적 배열에 넣음 ('CC'는 80% 투명도)
                        drawnPaths.push({ path: getPath(i), color: colors[i % colors.length] + 'CC' });
                    }
                    refreshCanvas(); // 한꺼번에 다시 그리기
                } else {
                    $(this).text('전체 결과 확인').data('status', 'ready');
                    $('.p-btn').removeClass('active').prop('disabled', false); // 버튼 복구
                    if (activeAnimation) cancelAnimationFrame(activeAnimation); // 실행 중인 애니메이션 중단
                    drawnPaths = []; // 데이터 초기화
                    refreshCanvas(); // 캔버스 초기화
                }
            });

            refreshCanvas(); // 페이지 로드 시 최초 1회 실행
            break;
    }
}