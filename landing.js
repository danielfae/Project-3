

var canvas = document.getElementById('circles');

function sketch(p) {

    var x, y;

    var gridSize;
    var gridColor;
    var activeCol;
    var activeRow;
    var pactiveCol;
    var pactiveRow;
    var gridW;
    var gridH;

    var txt;

    function setup() {
        p.size(canvas.offsetWidth, canvas.offsetHeight);

        p.ellipseMode(p.CENTER);
        p.rectMode(p.CENTER);

        // p.println("width: " + p.width + ", height: " + p.height);

        x = p.width / 2;
        y = p.height / 2;

        gridSize = 25;
        gridColor = p.color(0x0000FF, 80);

        p.textFont(p.createFont("Arial", 32));

        //p.noLoop();
    }

    function draw() {
        p.fill(0, 15);
        p.rect(p.width / 2, p.height / 2, p.width, p.height);

        grid(gridSize, gridColor, activeRow, activeCol);
        trace(activeCol * gridSize, activeRow * gridSize, pactiveCol * gridSize, pactiveRow * gridSize);

        txtW = p.textWidth(txt);
        p.fill(255);
        p.text(txt, ((activeCol - 0.5) * gridSize), ((activeRow - 0.5) * gridSize));
        //p.println(p.__frameRate);
    }

    p.mousePressed = function() {
        p.mouseDragged();
        gridColor = p.color(p.random(255), p.random(255), p.random(255), 128);
    }

    p.mouseReleased = function() {
        p.mouseMoved();
    }

    p.mouseMoved = function() {
        pactiveCol = activeCol;
        pactiveRow = activeRow;

        activeCol = p.floor(p.mouseX / gridSize) + 0.5;
        activeRow = p.floor(p.mouseY / gridSize) + 0.5;
    }

    p.mouseDragged = function() {
        pactiveCol = activeCol;
        pactiveRow = activeRow;

        activeCol = gridW - p.floor(p.mouseX / gridSize) - 0.5;
        activeRow = gridH - p.floor(p.mouseY / gridSize) - 0.5;
    }

    p.keyPressed = function() {
        pactiveCol = activeCol;
        pactiveRow = activeRow;

        switch (p.keyCode) {
            case 37:
                activeCol -= 1;
                if (activeCol < 0.5) activeCol = 0.5;
                break;
            case 39:
                activeCol += 1;
                if (activeCol > gridW - 0.5) activeCol = gridW - 0.5;
                break;
            case 38:
                activeRow -= 1;
                if (activeRow < 0.5) activeRow = 0.5;
                break;
            case 40:
                activeRow += 1;
                if (activeRow > gridH - 0.5) activeRow = gridH - 0.5;
                break;
            default:
                if ((p.keyCode > 64) && (p.keyCode < 123)) {
                    txt = String.fromCharCode(p.keyCode);
                }
                break;
        }

    }

    function grid(gridSize, gridColor, activeRow, activeCol) {
        gridW = p.width / gridSize;
        gridH = p.height / gridSize;

        for (var row = 0.5; row < gridH; row++) {
            for (var col = 0.5; col < gridW; col++) {
                var dotSize;
                if (typeof(activeCol) == 'undefined' || typeof(activeRow) == 'undefined') {
                    dotSize = gridSize * 0.9;
                } else {
                    dotSize = gridSize * p.dist(row, col, activeRow, activeCol) / p.max(gridW, gridH);
                }
                p.noStroke();
                p.fill(0, 64);
                p.rect(col * gridSize, row * gridSize, gridSize, gridSize);
                p.fill(gridColor);
                p.ellipse(col * gridSize, row * gridSize, dotSize, dotSize);
            }
        }
    }

    function trace(x1, y1, x2, y2) {
        p.fill(255);
        p.stroke(255);
        p.ellipse(x1, y1, 10, 10);
        p.line(x1, y1, x2, y2);
        p.ellipse(x2, y2, 10, 10);
    }

    p.setup = setup;
    p.draw = draw;

}

var p = new Processing(canvas, sketch); // actually attach and run the sketch
