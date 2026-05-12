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

            canvas.width = (playerCount - 1) * colWidth + padding * 2;
            canvas.height = canvasHeight;

            function drawBoard() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // 1. 기본 배경 사다리 (가장 뒤)
                ctx.strokeStyle = '#eee';
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

            // 경로 계산 함수 (좌표 배열 반환)
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

            // 경로 그리기 (z-index 효과를 위해 두께와 스타일 조절)
            function drawPathLine(path, color, isHighlight = false) {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = isHighlight ? 6 : 4; // 강조된 선은 더 굵게
                ctx.moveTo(path[0].x, path[0].y);
                path.forEach(pt => ctx.lineTo(pt.x, pt.y));
                ctx.stroke();
            }

            // 개별 선택 버튼 생성
            const $btnWrapper = $('#playerButtons').empty();
            for(let i=0; i<playerCount; i++) {
                $('<button>').addClass('p-btn').text(i+1)
                    .on('click', function() {
                        $('.p-btn').removeClass('active');
                        $(this).addClass('active');
                        drawBoard();
                        const path = getPath(i);
                        drawPathLine(path, colors[i % colors.length], true);
                    })
                    .appendTo($btnWrapper);
            }

            // [토글 버튼] 이벤트
            $('#toggleBtn').on('click', function() {
                const status = $(this).data('status');

                if (status === 'ready') {
                    // 즉시 전체 결과 보여주기
                    $(this).text('다시 하기').data('status', 'reset');
                    drawBoard();
                    // 순서대로 그려서 나중에 그린 선이 위로 오게 함 (z-index 효과)
                    for (let i = 0; i < playerCount; i++) {
                        drawPathLine(getPath(i), colors[i % colors.length] + 'CC'); 
                    }
                } else {
                    // 초기화
                    $(this).text('전체 결과 확인').data('status', 'ready');
                    $('.p-btn').removeClass('active');
                    drawBoard();
                }
            });

            drawBoard();
            break;
    }
}