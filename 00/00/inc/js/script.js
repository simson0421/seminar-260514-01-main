function contentScript(_idx, _content) {
    contentsIdx = _idx;
    contents = _content;

    switch (contentsIdx) {
        case 0:
            const canvas = document.getElementById('ladderCanvas');
            const ctx = canvas.getContext('2d');
            
            let players = 4;
            const width = 600;
            const height = 400;
            const padding = 50;

            $('#btnStart').click(function() {
                players = parseInt($('#playerCount').val());
                drawLadder();
            });

            function drawLadder() {
                canvas.width = width;
                canvas.height = height;
                ctx.clearRect(0, 0, width, height);
                
                const gap = (width - (padding * 2)) / (players - 1);
                
                // 1. 세로선 그리기
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 5;
                for (let i = 0; i < players; i++) {
                    let x = padding + (i * gap);
                    ctx.beginPath();
                    ctx.moveTo(x, 20);
                    ctx.lineTo(x, height - 20);
                    ctx.stroke();
                }

                // 2. 가로선(다리) 무작위 생성
                ctx.lineWidth = 3;
                for (let i = 0; i < players - 1; i++) {
                    let xStart = padding + (i * gap);
                    let xEnd = xStart + gap;
                    
                    // 각 칸 사이에 3~5개의 다리를 랜덤 배치
                    let bridgeCount = Math.floor(Math.random() * 3) + 3;
                    for (let j = 0; j < bridgeCount; j++) {
                        let y = Math.floor(Math.random() * (height - 100)) + 50;
                        ctx.beginPath();
                        ctx.moveTo(xStart, y);
                        ctx.lineTo(xEnd, y);
                        ctx.stroke();
                    }
                }
            }

            // 초기 실행
            drawLadder();
            break;
    }
}