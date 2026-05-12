function contentScript(_idx, _content) {
    contentsIdx = _idx;
    contents = _content;

    switch (contentsIdx) {
        case 0:
            const conSet1 = new contentsSet(contents);
            conSet1.clickCon(3);
            conSet1.clickCon.items.hide();
            conSet1.clickCon.onClick = function (pbIsOpen, pnIdx, pbIsSetRe) {
                if(drawnPaths.length == 3 && pbIsSetRe == true){
                    $('.ansbtn').addClass('re');
                }
            }

            /**
             * 사다리 타기 게임 코어 스크립트
             */
            // --- [1. 전역 제어 객체 정의] ---
            console.log('가로 선 위치 바꾸고 싶을 경우: ', 'ladder.data[index].height = 높이; ladder.init();');
            window.ladder = {
                playerCount: 3, // 게임에 참여할 총 인원 수 (세로 기둥의 개수)
                
                // 가로 다리 데이터: section은 시작 기둥 번호(0부터), height는 전체 높이 대비 비율(0~1)
                data: [
                    { section: 0, height: 0.3 },
                    { section: 0, height: 0.5 },
                    { section: 0, height: 0.7 },
                    { section: 1, height: 0.1 },
                    { section: 1, height: 0.4 },
                    { section: 1, height: 0.6 },
                    { section: 1, height: 0.8 },
                ],
                
                // 그래픽 설정을 담은 객체
                config: {
                    padding: 50,      // 캔버스 내부 여백 (px)
                    colWidth: 650,    // 기둥과 기둥 사이의 간격 (px)
                    canvasHeight: 600, // 캔버스 전체 높이 (px)
                    colors: ['#E91E63', '#9C27B0', '#2196F3', '#4CAF50', '#FFC107'] // 플레이어별 경로 색상
                },
                
                // 사다리 초기화 및 재설정 함수
                init: function() {
                    // 모든 플레이어의 개별 애니메이션 중단
                    Object.values(activeAnimations).forEach(id => cancelAnimationFrame(id));
                    activeAnimations = {}; // 초기화
                     
                    // 저장된 경로 데이터 초기화
                    drawnPaths = [];
                    
                    // 인원 수에 맞춰 캔버스 너비 동적 계산 (인원-1 * 간격 + 양쪽 여백)
                    canvas.width = (this.playerCount - 1) * this.config.colWidth + this.config.padding * 2;
                    canvas.height = this.config.canvasHeight;
                    
                    createButtons(); // 상단 플레이어 선택 버튼 생성
                    refreshCanvas(); // 기본 사다리 틀 그리기
                    // console.log("✅ 사다리가 성공적으로 재설정되었습니다.");
                }
            };

            // --- [2. 내부 변수 및 캔버스 준비] ---
            const canvas = document.getElementById('ladderCanvas'); // HTML 내 canvas 엘리먼트 참조
            const ctx = canvas.getContext('2d'); // 2D 렌더링 컨텍스트 획득
            let activeAnimations = {}; // 현재 진행 중인 requestAnimationFrame ID 저장 변수
            let drawnPaths = []; // 이미 완주한 경로 정보를 담는 배열

            // 실제 사다리 기둥이 그려지는 유효 높이(패딩 제외)를 반환하는 함수
            const getInnerHeight = () => ladder.config.canvasHeight - (ladder.config.padding * 2);

            // --- [3. 핵심 로직 함수] ---

            /**
             * 화면을 모두 지우고 배경 기둥과 가로 다리, 기존 경로를 다시 그리는 함수
             */
            function refreshCanvas() {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 전체 영역 초기화
                ctx.lineCap = 'round';  // 선 끝 모양을 둥글게
                ctx.lineJoin = 'round'; // 선 꺾임 부위를 둥글게

                // 1. 기본 배경 기둥(회색) 그리기
                ctx.strokeStyle = '#eee'; // 기둥 색상
                ctx.lineWidth = 5;         // 기둥 두께
                for (let i = 0; i < ladder.playerCount; i++) {
                    const x = ladder.config.padding + i * ladder.config.colWidth; // i번째 기둥의 X 좌표
                    ctx.beginPath();
                    ctx.moveTo(x, ladder.config.padding); // 시작점 (상단 패딩)
                    ctx.lineTo(x, canvas.height - ladder.config.padding); // 끝점 (하단 패딩)
                    ctx.stroke();
                }

                // 2. 가로 다리 그리기 (ladder.data에 정의된 위치 기준)
                ladder.data.forEach(line => {
                    const x = ladder.config.padding + (line.section * ladder.config.colWidth); // 시작 기둥 X
                    const y = ladder.config.padding + (line.height * getInnerHeight());       // 높이 비율에 따른 Y
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + ladder.config.colWidth, y); // 다음 기둥까지 가로선
                    ctx.stroke();
                });

                // 3. 이미 완료된 경로(drawnPaths)가 있다면 화면에 유지
                drawnPaths.forEach(p => drawPathInstant(p.path, p.color));
            }

            /**
             * 특정 시작 지점에서 끝까지 도달하는 경로 좌표 배열을 계산하는 함수
             * @param {number} startIdx - 시작하는 플레이어의 인덱스 (0부터 시작)
             */
            function getPath(startIdx) {
                let curIdx = startIdx; // 현재 위치한 기둥 인덱스
                let curY = ladder.config.padding; // 현재 위치한 Y 좌표
                const path = [{ x: curIdx * ladder.config.colWidth + ladder.config.padding, y: curY }];
                
                // 가로 다리 데이터를 높이(height) 순으로 정렬하여 위에서부터 탐색 준비
                const sortedLines = [...ladder.data].sort((a, b) => a.height - b.height);

                while (curY < canvas.height - ladder.config.padding) {
                    // 현재 기둥(curIdx)과 연결된 다음 가로 다리 탐색 (현재 높이보다 아래에 있는 것 중 가장 가까운 것)
                    const nextBridge = sortedLines.find(line =>
                        (line.height * getInnerHeight() + ladder.config.padding) > curY + 1 &&
                        (line.section === curIdx || line.section === curIdx - 1)
                    );

                    if (nextBridge) {
                        const bridgeY = nextBridge.height * getInnerHeight() + ladder.config.padding;
                        // 다리 시작점까지 내려가기
                        path.push({ x: curIdx * ladder.config.colWidth + ladder.config.padding, y: bridgeY });
                        // 다리 건너기 (왼쪽 혹은 오른쪽 기둥으로 이동)
                        curIdx = (nextBridge.section === curIdx) ? curIdx + 1 : curIdx - 1;
                        path.push({ x: curIdx * ladder.config.colWidth + ladder.config.padding, y: bridgeY });
                        curY = bridgeY; // Y 좌표 업데이트
                    } else {
                        // 더 이상 다리가 없으면 바닥까지 직선 이동
                        path.push({ x: curIdx * ladder.config.colWidth + ladder.config.padding, y: canvas.height - ladder.config.padding });
                        curY = canvas.height - ladder.config.padding;
                    }
                }
                return path; // 계산된 모든 좌표 배열 반환
            }

            /**
             * 계산된 경로를 애니메이션으로 그리는 함수
             * @param {number} playerIdx - 플레이어 번호
             * @param {Array} path - getPath()로 얻은 좌표 배열
             * @param {string} color - 선 색상
             */
            async function animatePath(playerIdx, path, color) {
                for (let i = 0; i < path.length - 1; i++) {
                    // 좌표 배열의 각 구간(Segment)을 하나씩 순차적으로 이동하며 그리기
                    await moveSegment(playerIdx, path[i], path[i + 1], color);
                }
                drawnPaths.push({ path, color }); // 완주 후 경로 저장
                // console.log(`${playerIdx + 1}번 플레이어 도착!`);
                conSet1.clickCon.items.eq(playerIdx).show();
            }

            /**
             * 두 지점 사이를 애니메이션화하여 연결하는 함수
             * @param {Object} start - 시작 좌표 {x, y}
             * @param {Object} end - 종료 좌표 {x, y}
             * @param {string} color - 선 색상
             */
            function moveSegment(playerIdx, start, end, color) {
                return new Promise(resolve => {
                    let curX = start.x;
                    let curY = start.y;
                    const speed = 10; // 선이 그려지는 속도 (숫자가 클수록 빠름)

                    const step = () => {
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 6;
                        ctx.moveTo(curX, curY);

                        // 가로 이동 (X좌표 변화)
                        if (start.x !== end.x) {
                            if (Math.abs(curX - end.x) < speed) curX = end.x;
                            else curX += (end.x > start.x ? speed : -speed);
                        }
                        // 세로 이동 (Y좌표 변화)
                        if (start.y !== end.y) {
                            if (Math.abs(curY - end.y) < speed) curY = end.y;
                            else curY += speed;
                        }

                        ctx.lineTo(curX, curY);
                        ctx.stroke();

                        // 목표점 도착 시 프레임 종료, 미도달 시 다음 프레임 요청
                        if (curX === end.x && curY === end.y) {
                            delete activeAnimations[playerIdx]; // 해당 인덱스 애니메이션 종료
                            resolve();
                        } else {
                            // 해당 플레이어 전용 슬롯에 애니메이션 ID 저장
                            activeAnimations[playerIdx] = requestAnimationFrame(step);
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
                path.forEach(pt => ctx.lineTo(pt.x, pt.y));
                ctx.stroke();
            }

            // --- [4. 이벤트 바인딩 및 버튼 생성] ---

            /**
             * 플레이어 인원 수에 맞게 상단 클릭 버튼을 동적으로 생성
             */
            function createButtons() {
                const $btnWrapper = $('#playerButtons').empty(); // 버튼 컨테이너 비우기
                for (let i = 0; i < ladder.playerCount; i++) {
                    $('<button>').addClass('p-btn').on('click', function () {
                            const color = ladder.config.colors[i % ladder.config.colors.length];
                            // 이미 그려진 경로가 있다면 중복 클릭 방지
                            if (drawnPaths.some(p => p.color === color)) return;
                            $(this).addClass('active').prop('disabled', true); // 버튼 비활성화 시각화
                            animatePath(i, getPath(i), color); // 경로 계산 후 애니메이션 시작
                        })
                        .appendTo($btnWrapper);
                }
            }

            /**
             * 결과 보기/다시 하기 버튼 이벤트 (클래스 'ansbtn' 기준)
             */
            $('.ansbtn').off('click').on('click', function () {
                let $ts = $(this);
                if ($ts.hasClass('re')) {
                    // '다시 하기' 상태일 때: 초기화 실행
                    $ts.removeClass('re');
                    conSet1.clickCon.init();
                    conSet1.clickCon.items.hide();

                    ladder.init(); 
                } else {
                    // '전체 결과 보기' 상태일 때
                    $ts.addClass('re');
                    conSet1.clickCon.items.addClass('on');
                    drawnPaths = [];
                    for (let i = 0; i < ladder.playerCount; i++) {
                        // 모든 플레이어의 경로를 즉시 계산하여 배열에 추가
                        drawnPaths.push({ 
                            path: getPath(i), 
                            color: ladder.config.colors[i]
                            // color: ladder.config.colors[i % ladder.config.colors.length] + 'CC' // 투명도 추가
                        });
                    }
                    Object.values(activeAnimations).forEach(id => cancelAnimationFrame(id));
                    activeAnimations = {}; // 초기화
                    refreshCanvas(); // 즉시 전체 경로 렌더링
                }
            });

            // 페이지 로드 시 최초 1회 실행
            ladder.init();
            break;
    }
}