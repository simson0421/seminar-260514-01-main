function contentScript(_idx, _content) {
    contentsIdx = _idx;
    contents = _content;

    switch (contentsIdx) {
        case 0:
            /**
             * 대각선 지원 사다리 타기 게임 코어 스크립트
             */
            // --- [1. 전역 제어 객체 정의] ---
            window.ladder = {
                playerCount: 3,
                
                // data 구조 변경: height(시작 높이), endHeight(끝 높이)
                // section 0에서 시작하면 0번 기둥(height) -> 1번 기둥(endHeight)으로 연결됨
                data: [
                    { section: 0, height: 0.1, endHeight: 0.3 }, // 0->1번 대각선 하강
                    { section: 1, height: 0.2, endHeight: 0.2 }, // 1->2번 평행선
                    { section: 0, height: 0.5, endHeight: 0.4 }, // 0->1번 대각선 상승
                    { section: 1, height: 0.6, endHeight: 0.8 }, // 1->2번 대각선 하강
                    { section: 0, height: 0.8, endHeight: 0.8 }, // 0->1번 평행선
                ],
                
                config: {
                    padding: 50,
                    colWidth: 200, // 테스트를 위해 간격 조정
                    canvasHeight: 600,
                    colors: ['#E91E63', '#9C27B0', '#2196F3', '#4CAF50', '#FFC107']
                },
                
                init: function() {
                    Object.values(activeAnimations).forEach(id => cancelAnimationFrame(id));
                    activeAnimations = {};
                    drawnPaths = [];
                    
                    canvas.width = (this.playerCount - 1) * this.config.colWidth + this.config.padding * 2;
                    canvas.height = this.config.canvasHeight;
                    
                    createButtons();
                    refreshCanvas();
                }
            };

            // --- [2. 내부 변수 및 캔버스 준비] ---
            const canvas = document.getElementById('ladderCanvas');
            const ctx = canvas.getContext('2d');
            let activeAnimations = {};
            let drawnPaths = [];

            const getInnerHeight = () => ladder.config.canvasHeight - (ladder.config.padding * 2);

            // --- [3. 핵심 로직 함수] ---

            /**
             * 화면 새로고침 (배경 및 사선 포함)
             */
            function refreshCanvas() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // 1. 기둥 그리기
                ctx.strokeStyle = '#eee';
                ctx.lineWidth = 5;
                for (let i = 0; i < ladder.playerCount; i++) {
                    const x = ladder.config.padding + i * ladder.config.colWidth;
                    ctx.beginPath();
                    ctx.moveTo(x, ladder.config.padding);
                    ctx.lineTo(x, canvas.height - ladder.config.padding);
                    ctx.stroke();
                }

                // 2. 가로/대각 다리 그리기
                ladder.data.forEach(line => {
                    const x1 = ladder.config.padding + (line.section * ladder.config.colWidth);
                    const y1 = ladder.config.padding + (line.height * getInnerHeight());
                    const x2 = x1 + ladder.config.colWidth;
                    const y2 = ladder.config.padding + ((line.endHeight ?? line.height) * getInnerHeight());

                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                });

                // 3. 완료된 경로 유지
                drawnPaths.forEach(p => drawPathInstant(p.path, p.color));
            }

            /**
             * 대각선을 고려한 경로 계산
             */
            function getPath(startIdx) {
                let curIdx = startIdx;
                let curY = ladder.config.padding;
                const path = [{ x: curIdx * ladder.config.colWidth + ladder.config.padding, y: curY }];
                
                // 다리 데이터를 높이 순(둘 중 높은 쪽 기준)으로 정렬
                const sortedLines = [...ladder.data].sort((a, b) => {
                    const minA = Math.min(a.height, a.endHeight ?? a.height);
                    const minB = Math.min(b.height, b.endHeight ?? b.height);
                    return minA - minB;
                });

                while (curY < canvas.height - ladder.config.padding) {
                    // 현재 기둥에서 연결된 '다음' 다리 찾기
                    const nextBridge = sortedLines.find(line => {
                        const startY = line.height * getInnerHeight() + ladder.config.padding;
                        const endY = (line.endHeight ?? line.height) * getInnerHeight() + ladder.config.padding;
                        
                        // 현재 기둥이 시작점인 경우 (오른쪽행) 또는 끝점인 경우 (왼쪽행)
                        if (line.section === curIdx) return startY > curY + 0.1;
                        if (line.section === curIdx - 1) return endY > curY + 0.1;
                        return false;
                    });

                    if (nextBridge) {
                        const startY = nextBridge.height * getInnerHeight() + ladder.config.padding;
                        const endY = (nextBridge.endHeight ?? nextBridge.height) * getInnerHeight() + ladder.config.padding;

                        if (nextBridge.section === curIdx) {
                            // 오른쪽으로 대각선 이동
                            path.push({ x: curIdx * ladder.config.colWidth + ladder.config.padding, y: startY });
                            curIdx++;
                            curY = endY;
                        } else {
                            // 왼쪽으로 대각선 이동
                            path.push({ x: curIdx * ladder.config.colWidth + ladder.config.padding, y: endY });
                            curIdx--;
                            curY = startY;
                        }
                        path.push({ x: curIdx * ladder.config.colWidth + ladder.config.padding, y: curY });
                    } else {
                        // 바닥 도달
                        curY = canvas.height - ladder.config.padding;
                        path.push({ x: curIdx * ladder.config.colWidth + ladder.config.padding, y: curY });
                    }
                }
                return path;
            }

            /**
             * 애니메이션 실행
             */
            async function animatePath(playerIdx, path, color) {
                for (let i = 0; i < path.length - 1; i++) {
                    await moveSegment(playerIdx, path[i], path[i + 1], color);
                }
                drawnPaths.push({ path, color });
                // 완료 후 결과 처리 (예: conSet1... 등 외부 코드 연동)
                if (window.conSet1) conSet1.clickCon.items.eq(playerIdx).show();
            }

            /**
             * 구간별 이동 (대각선 대응)
             */
            function moveSegment(playerIdx, start, end, color) {
                return new Promise(resolve => {
                    let curX = start.x;
                    let curY = start.y;
                    const speed = 10;

                    const step = () => {
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 6;
                        ctx.moveTo(curX, curY);

                        const dx = end.x - start.x;
                        const dy = end.y - start.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance === 0) {
                            resolve();
                            return;
                        }

                        // 대각선 이동을 위한 벡터 계산
                        const vx = (dx / distance) * speed;
                        const vy = (dy / distance) * speed;

                        if (Math.sqrt(Math.pow(end.x - curX, 2) + Math.pow(end.y - curY, 2)) < speed) {
                            curX = end.x;
                            curY = end.y;
                        } else {
                            curX += vx;
                            curY += vy;
                        }

                        ctx.lineTo(curX, curY);
                        ctx.stroke();

                        if (curX === end.x && curY === end.y) {
                            delete activeAnimations[playerIdx];
                            resolve();
                        } else {
                            activeAnimations[playerIdx] = requestAnimationFrame(step);
                        }
                    };
                    step();
                });
            }

            function drawPathInstant(path, color) {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 5;
                ctx.moveTo(path[0].x, path[0].y);
                path.forEach(pt => ctx.lineTo(pt.x, pt.y));
                ctx.stroke();
            }

            // --- [4. 이벤트 바인딩] ---
            function createButtons() {
                const $wrapper = $('#playerButtons').empty();
                for (let i = 0; i < ladder.playerCount; i++) {
                    $('<button>').addClass('p-btn').text(i + 1).on('click', function() {
                        const color = ladder.config.colors[i % ladder.config.colors.length];
                        if (drawnPaths.some(p => p.color === color)) return;
                        $(this).addClass('active').prop('disabled', true);
                        animatePath(i, getPath(i), color);
                    }).appendTo($wrapper);
                }
            }

            $('.ansbtn').on('click', function () {
                let $ts = $(this);
                if ($ts.hasClass('re')) {
                    $ts.removeClass('re');
                    ladder.init(); 
                } else {
                    $ts.addClass('re');
                    drawnPaths = [];
                    for (let i = 0; i < ladder.playerCount; i++) {
                        drawnPaths.push({ path: getPath(i), color: ladder.config.colors[i % ladder.config.colors.length] });
                    }
                    Object.values(activeAnimations).forEach(id => cancelAnimationFrame(id));
                    activeAnimations = {};
                    refreshCanvas();
                }
            });

            ladder.init();
            break;
    }
}