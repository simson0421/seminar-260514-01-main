function contentScript(_idx, _content) {
    contentsIdx = _idx;
    contents = _content;

    switch (contentsIdx) {
        case 0:
            const canvas = document.getElementById('ladderCanvas');
            const ctx = canvas.getContext('2d');
            
            // --- [사용자 설정 데이터] ---
            const playerCount = 5;
            const ladderData = [
                { section: 0, height: 0.2 },
                { section: 1, height: 0.3 },
                { section: 2, height: 0.5 },
                { section: 3, height: 0.15 },
                { section: 0, height: 0.6 },
                { section: 2, height: 0.8 },
                { section: 3, height: 0.7 }
            ];

            const padding = 50;
            const colWidth = 100;
            const canvasHeight = 600;
            const innerHeight = canvasHeight - (padding * 2);
            
            canvas.width = (playerCount - 1) * colWidth + padding * 2;
            canvas.height = canvasHeight;

            // 기본 사다리판 그리기
            function drawBoard() {
                ctx.strokeStyle = '#ddd'; // 기본 선은 연하게
                ctx.lineWidth = 2;
                for (let i = 0; i < playerCount; i++) {
                    const x = padding + i * colWidth;
                    ctx.beginPath(); ctx.moveTo(x, padding); ctx.lineTo(x, canvas.height - padding); ctx.stroke();
                }
                ladderData.forEach(line => {
                    const x = padding + (line.section * colWidth);
                    const y = padding + (line.height * innerHeight);
                    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + colWidth, y); ctx.stroke();
                });
            }

            // 상단 버튼 생성
            for(let i=0; i<playerCount; i++) {
                $('<button>').addClass('p-btn').text(i+1)
                    .css('margin', `0 ${colWidth/2 - 20}px`)
                    .on('click', () => startLadder(i))
                    .appendTo('#playerButtons');
            }

            // 경로 추적 로직
            async function startLadder(startIdx) {
                let curIdx = startIdx;
                let curY = padding;
                
                ctx.strokeStyle = '#FF5722'; // 진행 경로 색상
                ctx.lineWidth = 5;

                // 높이순으로 정렬된 가로선 데이터
                const sortedLines = [...ladderData].sort((a, b) => a.height - b.height);

                while (curY < canvasHeight - padding) {
                    // 현재 위치보다 아래에 있는 가로선 중 가장 가까운 선 찾기
                    const nextBridge = sortedLines.find(line => 
                        line.height * innerHeight + padding > curY + 1 && 
                        (line.section === curIdx || line.section === curIdx - 1)
                    );

                    if (nextBridge) {
                        const bridgeY = nextBridge.height * innerHeight + padding;
                        // 1. 세로로 이동
                        await animate(curIdx * colWidth + padding, curY, curIdx * colWidth + padding, bridgeY);
                        curY = bridgeY;

                        // 2. 가로로 이동
                        const nextX = (nextBridge.section === curIdx) 
                                    ? (curIdx + 1) * colWidth + padding 
                                    : (curIdx - 1) * colWidth + padding;
                        await animate(curIdx * colWidth + padding, curY, nextX, curY);
                        curIdx = (nextBridge.section === curIdx) ? curIdx + 1 : curIdx - 1;
                    } else {
                        // 더 이상 가로선이 없으면 바닥까지 이동
                        await animate(curIdx * colWidth + padding, curY, curIdx * colWidth + padding, canvasHeight - padding);
                        curY = canvasHeight - padding;
                    }
                }
                alert(`${startIdx + 1}번 참여자 도착!`);
            }

            // 선 그리기 애니메이션 함수 (Promise 활용)
            function animate(x1, y1, x2, y2) {
                return new Promise(resolve => {
                    let curX = x1, curY = y1;
                    const step = () => {
                        ctx.beginPath();
                        ctx.moveTo(curX, curY);
                        if (x1 !== x2) curX += (x2 > x1 ? 5 : -5);
                        if (y1 !== y2) curY += 5;
                        ctx.lineTo(curX, curY);
                        ctx.stroke();

                        if ((x1 !== x2 && Math.abs(curX - x2) < 5) || (y1 !== y2 && Math.abs(curY - y2) < 5)) {
                            ctx.lineTo(x2, y2); ctx.stroke(); // 끝점 보정
                            resolve();
                        } else {
                            requestAnimationFrame(step);
                        }
                    };
                    step();
                });
            }

            drawBoard();
            break;
    }
}