function contentScript(_idx, _content) {
    contentsIdx = _idx;
    contents = _content;

    switch (contentsIdx) {
        case 0:
            const canvas = document.getElementById('ladderCanvas');
            const ctx = canvas.getContext('2d');
            
            let playerCount = 4;
            let horizontalLines = []; // 가로선 데이터 저장
            const padding = 50;
            const speed = 5; // 애니메이션 속도

            function init() {
                playerCount = parseInt($('#playerCount').val());
                canvas.width = (playerCount - 1) * 100 + padding * 2;
                canvas.height = 500;
                horizontalLines = [];
                drawBoard();
            }

            // 기본 세로선 그리기
            function drawBoard() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';

                for (let i = 0; i < playerCount; i++) {
                    const x = padding + i * 100;
                    ctx.beginPath();
                    ctx.moveTo(x, padding);
                    ctx.lineTo(x, canvas.height - padding);
                    ctx.stroke();
                }
                
                // 저장된 가로선들 다시 그리기
                horizontalLines.forEach(line => {
                    drawHorizontalLine(line.x, line.y);
                });
            }

            // 가로선 그리기 함수
            function drawHorizontalLine(x, y) {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 100, y);
                ctx.stroke();
            }

            // 클릭 시 가로선 추가 (자연스러운 애니메이션)
            $(canvas).on('click', function(e) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // 어느 세로선 사이인지 계산
                const lineIndex = Math.floor((mouseX - padding) / 100);
                
                if (lineIndex >= 0 && lineIndex < playerCount - 1) {
                    const startX = padding + lineIndex * 100;
                    const targetY = mouseY;

                    // 중복 클릭 방지 및 데이터 저장
                    horizontalLines.push({x: startX, y: targetY, section: lineIndex});
                    animateLine(startX, targetY);
                }
            });

            // 선이 쭉 그어지는 애니메이션
            function animateLine(startX, y) {
                let currentX = startX;
                const endX = startX + 100;

                function step() {
                    if (currentX < endX) {
                        ctx.beginPath();
                        ctx.strokeStyle = '#FF5722'; // 그려질 때 강조색
                        ctx.moveTo(currentX, y);
                        currentX += speed;
                        ctx.lineTo(currentX, y);
                        ctx.stroke();
                        requestAnimationFrame(step);
                    } else {
                        drawBoard(); // 최종적으로 검은색 고정
                    }
                }
                step();
            }

            $('#resetBtn').click(init);
            $('#playerCount').change(init);
            
            init();
            break;
    }
}