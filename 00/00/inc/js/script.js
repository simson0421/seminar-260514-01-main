function contentScript(_idx, _content) {
    contentsIdx = _idx;
    contents = _content;

    switch (contentsIdx) {
        case 0:
            const canvas = document.getElementById('ladderCanvas');
            const ctx = canvas.getContext('2d');
            
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
            const colors = ['#E91E63', '#9C27B0', '#2196F3', '#4CAF50', '#FFC107'];
            
            let activeAnimation = null; // 현재 진행 중인 애니메이션 제어용

            canvas.width = (playerCount - 1) * colWidth + padding * 2;
            canvas.height = canvasHeight;

            function drawBoard() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#eee';
                ctx.lineWidth = 2;

                // 배경 사다리 그리기
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

            // 경로 데이터 추출 (좌표 리스트)
            function getPath(startIdx) {
                let curIdx = startIdx;
                let curY = padding;
                const path = [{x: curIdx * colWidth + padding, y: curY}];
                const sortedLines = [...ladderData].sort((a, b) => a.height - b.height);

                while (curY < canvasHeight - padding) {
                    const nextBridge = sortedLines.find(line => 
                        line.height * innerHeight + padding > curY + 1 && 
                        (line.section === curIdx || line.section === curIdx - 1)
                    );

                    if (nextBridge) {
                        const bridgeY = nextBridge.height * innerHeight + padding;
                        path.push({x: curIdx * colWidth + padding, y: bridgeY});
                        curIdx = (nextBridge.section === curIdx) ? curIdx + 1 : curIdx - 1;
                        path.push({x: curIdx * colWidth + padding, y: bridgeY});
                        curY = bridgeY;
                    } else {
                        path.push({x: curIdx * colWidth + padding, y: canvasHeight - padding});
                        curY = canvasHeight - padding;
                    }
                }
                return path;
            }

            // [애니메이션] 개별 경로 그리기
            async function animatePath(path, color) {
                if (activeAnimation) cancelAnimationFrame(activeAnimation);
                
                for (let i = 0; i < path.length - 1; i++) {
                    await moveSegment(path[i], path[i+1], color);
                }
            }

            function moveSegment(start, end, color) {
                return new Promise(resolve => {
                    let curX = start.x;
                    let curY = start.y;
                    const speed = 10;

                    const step = () => {
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 6;
                        ctx.moveTo(curX, curY);

                        if (start.x !== end.x) curX += (end.x > start.x ? speed : -speed);
                        if (start.y !== end.y) curY += speed;

                        ctx.lineTo(curX, curY);
                        ctx.stroke();

                        if (Math.abs(curX - end.x) < speed && Math.abs(curY - end.y) < speed) {
                            ctx.lineTo(end.x, end.y); ctx.stroke();
                            resolve();
                        } else {
                            activeAnimation = requestAnimationFrame(step);
                        }
                    };
                    step();
                });
            }

            // [즉시] 경로 그리기
            function drawPathInstant(path, color) {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.moveTo(path[0].x, path[0].y);
                path.forEach(pt => ctx.lineTo(pt.x, pt.y));
                ctx.stroke();
            }

            // 개별 버튼 이벤트
            const $btnWrapper = $('#playerButtons').empty();
            for(let i=0; i<playerCount; i++) {
                $('<button>').addClass('p-btn').text(i+1)
                    .on('click', function() {
                        $('.p-btn').removeClass('active');
                        $(this).addClass('active');
                        drawBoard(); // 캔버스 초기화 후 애니메이션 시작
                        animatePath(getPath(i), colors[i % colors.length]);
                    })
                    .appendTo($btnWrapper);
            }

            // 토글 버튼 이벤트
            $('#toggleBtn').on('click', function() {
                const status = $(this).data('status');
                if (status === 'ready') {
                    $(this).text('다시 하기').data('status', 'reset');
                    drawBoard();
                    // 전체 확인은 "즉시" 그리기 (z-index 순서대로)
                    for (let i = 0; i < playerCount; i++) {
                        drawPathInstant(getPath(i), colors[i % colors.length] + 'CC');
                    }
                } else {
                    $(this).text('전체 결과 확인').data('status', 'ready');
                    $('.p-btn').removeClass('active');
                    if (activeAnimation) cancelAnimationFrame(activeAnimation);
                    drawBoard();
                }
            });

            drawBoard();
            break;
    }
}