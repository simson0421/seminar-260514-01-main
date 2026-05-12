function contentScript(_idx, _content) {
    contentsIdx = _idx;
    contents = _content;

    switch (contentsIdx) {
        case 0:
            const canvas = document.getElementById('ladderCanvas');
            const ctx = canvas.getContext('2d');
            
            // --- 설정 데이터 ---
            const playerCount = 5;
            const ladderData = [
                { section: 0, height: 0.2 }, { section: 1, height: 0.35 },
                { section: 2, height: 0.5 }, { section: 3, height: 0.15 },
                { section: 0, height: 0.7 }, { section: 2, height: 0.8 },
                { section: 3, height: 0.65 }, { section: 1, height: 0.85 }
            ];

            const padding = 50;
            const colWidth = 100;
            const canvasHeight = 600;
            const innerHeight = canvasHeight - (padding * 2);
            let isGaming = false;

            canvas.width = (playerCount - 1) * colWidth + padding * 2;
            canvas.height = canvasHeight;

            // 경로 색상 리스트
            const colors = ['#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#FFC107'];

            function drawBoard() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 2;
                // 세로선 및 가로선 그리기 (생략 가능 - 이전 코드와 동일)
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

            // 모든 경로를 순차적으로 계산하여 그리는 함수
            async function drawAllPaths() {
                isGaming = true;
                const promises = [];
                
                for (let i = 0; i < playerCount; i++) {
                    // 각 경로가 서로 겹쳐도 보이게 투명도 조절
                    promises.push(startLadder(i, colors[i % colors.length] + 'BB'));
                }
                
                await Promise.all(promises);
                isGaming = false;
            }

            async function startLadder(startIdx, color) {
                let curIdx = startIdx;
                let curY = padding;
                const sortedLines = [...ladderData].sort((a, b) => a.height - b.height);

                while (curY < canvasHeight - padding) {
                    if(!isGaming) return;

                    const nextBridge = sortedLines.find(line => 
                        line.height * innerHeight + padding > curY + 1 && 
                        (line.section === curIdx || line.section === curIdx - 1)
                    );

                    if (nextBridge) {
                        const bridgeY = nextBridge.height * innerHeight + padding;
                        await animate(curIdx * colWidth + padding, curY, curIdx * colWidth + padding, bridgeY, color);
                        curY = bridgeY;
                        const nextX = (nextBridge.section === curIdx) ? (curIdx + 1) * colWidth + padding : (curIdx - 1) * colWidth + padding;
                        await animate(curIdx * colWidth + padding, curY, nextX, curY, color);
                        curIdx = (nextBridge.section === curIdx) ? curIdx + 1 : curIdx - 1;
                    } else {
                        await animate(curIdx * colWidth + padding, curY, curIdx * colWidth + padding, canvasHeight - padding, color);
                        curY = canvasHeight - padding;
                    }
                }
            }

            function animate(x1, y1, x2, y2, color) {
                return new Promise(resolve => {
                    let curX = x1, curY = y1;
                    const step = () => {
                        if(!isGaming) return;
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 4;
                        ctx.moveTo(curX, curY);
                        if (x1 !== x2) curX += (x2 > x1 ? 10 : -10);
                        if (y1 !== y2) curY += 10;
                        
                        if (Math.abs(curX - x2) <= 10 && Math.abs(curY - y2) <= 10) {
                            ctx.lineTo(x2, y2); ctx.stroke();
                            resolve();
                        } else {
                            ctx.lineTo(curX, curY); ctx.stroke();
                            requestAnimationFrame(step);
                        }
                    };
                    step();
                });
            }

            // 토글 버튼 이벤트
            $('#toggleBtn').on('click', function() {
                const status = $(this).data('status');

                if (status === 'ready') {
                    // 확인하기 클릭 시
                    $(this).text('다시 하기').data('status', 'reset').prop('disabled', true);
                    drawAllPaths().then(() => {
                        $('#toggleBtn').prop('disabled', false);
                    });
                } else {
                    // 다시하기 클릭 시
                    isGaming = false;
                    $(this).text('전체 결과 확인').data('status', 'ready');
                    drawBoard();
                }
            });

            drawBoard();
            break;
    }
}