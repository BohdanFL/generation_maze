const SIDES = {
    top: 0,
    right: 1,
    bottom: 2,
    left: 3,
};

const moveVector = [
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 }, // right
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
];

const oppositeSide = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
};

const randomProperty = (object) => {
    const keys = Object.keys(object);
    if (keys.length > 0) {
        const index = Math.floor(keys.length * Math.random());
        const key = keys[index];
        const value = object[key];
        return { index, key, value };
    }
    return null;
};

const startBtn = document.getElementById("start-btn")

class MazeCell {
    constructor(position = { x: 0, y: 0 }) {
        this.borders = { top: 1, bottom: 1, left: 1, right: 1 };
        this.position = position;
        this.passed = false;
    }
}

class Maze {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.parent = document.body;
        this.cells = [];
        this.passedCells = [];
        this.generated = false;
    }

    render() {
        let mazeHtml = `<table class="maze">`;

        for (let i = 0; i < this.rows; i++) {
            mazeHtml += `<tr class="maze-row">`;

            for (let j = 0; j < this.cols; j++) {
                mazeHtml += `<td class="maze-cell"></td>`;
                this.cells.push(new MazeCell({ x: j, y: i }));
            }
            mazeHtml += `</tr>`;
        }
        mazeHtml += `</table>`;

        this.parent.insertAdjacentHTML("afterbegin", mazeHtml);
    }

    updateCellBorder(index, side) {
        const currCell = this.cells[index];
        currCell.borders[side] = 0;
        const cellSelector = `
            tr:nth-child(${currCell.position.y + 1}) 
            td:nth-child(${currCell.position.x + 1})
        `;
        const cellElem = this.parent.querySelector(cellSelector);
        const capSide = side.charAt(0).toUpperCase() + side.slice(1);
        cellElem.style["border" + capSide] = "0";
    }

    setCellPassed(index) {
        const currCell = this.cells[index];
        currCell.passed = true;
        this.passedCells.push(currCell);

        const cellSelector = `tr:nth-child(${
            currCell.position.y + 1
        }) td:nth-child(${currCell.position.x + 1})`;
        const cellElem = this.parent.querySelector(cellSelector);
        cellElem.style.backgroundColor = "#fff";
    }

    setGenerator(generator) {
        this.generator = generator;
        this.generator.maze = this;
        const mazeHtml = this.parent.querySelector(".maze");

        const cellIndex =
            this.generator.position.x + this.generator.position.y * this.rows;
        this.setCellPassed(cellIndex);

        mazeHtml.insertAdjacentElement("afterbegin", generator.html);
    }

    generate() {
        const stepping = (counter = 0) => {
            setTimeout(() => {
                counter++;
                // Отримуємо сторону наступного кроку
                const nextSide = this.generator.getNextSide();
                // console.log(this.generator.position);

                if (nextSide) {
                    this.generator.takenPath.push({
                        ...this.generator.position,
                    });
                    // Індекс клітиин до кроку
                    const pastCellIndex =
                        this.generator.position.x +
                        this.generator.position.y * this.rows;

                    // Робимо крок
                    this.generator.moveTo(moveVector[nextSide.value]);

                    // Індекс поточної клітини
                    const cellIndex =
                        this.generator.position.x +
                        this.generator.position.y * this.rows;
                    // Позначаємо клітинку пройденою
                    this.setCellPassed(cellIndex);
                    this.updateCellBorder(pastCellIndex, nextSide.key);
                    this.updateCellBorder(
                        cellIndex,
                        oppositeSide[nextSide.key]
                    );
                } else {
                    const lastPosition = this.generator.takenPath.pop();
                    const backMoveVector = {
                        x: lastPosition.x - this.generator.position.x,
                        y: lastPosition.y - this.generator.position.y,
                    };

                    this.generator.moveTo(backMoveVector);
                }
                if (this.cells.length !== this.passedCells.length) {
                    stepping();
                } else {
                    this.generated = true;
                    console.log("GENERATING HAVE BEEN FINISHED");
                }
            }, 100);
        };
        stepping();
    }

    generateEntrance(amount = 0) {
        const randomRow = Math.floor(Math.random() * this.rows);
        const randomCol = Math.floor(Math.random() * this.cols);

        const sidesKeys = Object.keys(SIDES);
        let randomSide =
            sidesKeys[Math.floor(Math.random() * sidesKeys.length)];

        let cellIndex;
        
        if (randomSide === "top") {
            cellIndex = randomCol;
        } else if (randomSide === "bottom") {
            cellIndex = this.rows * (this.rows - 1) + randomCol;
        } else if (randomSide === "left") {
            cellIndex = randomRow * this.rows;
        } else if (randomSide === "right") {
            cellIndex = randomRow * this.rows + (this.cols - 1);
        }

        this.updateCellBorder(cellIndex, randomSide);
    }
}

class Generator {
    constructor(position = { x: 0, y: 0 }) {
        this.position = position;
        this.maze;
        this.takenPath = [];

        this.html = document.createElement("div");
        this.html.className = "generator";
        this.html.style.inset = `${3 + this.position.y * 20}px 0 0 
        ${3 + this.position.x * 20}px`;
    }

    getNextSide() {
        const tempSides = { ...SIDES };

        // Перевірка границь
        if (this.position.x === 0 && this.position.y === 0) {
            delete tempSides["left"];
            delete tempSides["top"];
        } else if (
            this.position.x === 0 &&
            this.position.y === this.maze.rows - 1
        ) {
            delete tempSides["left"];
            delete tempSides["bottom"];
        } else if (
            this.position.x === this.maze.cols - 1 &&
            this.position.y === 0
        ) {
            delete tempSides["top"];
            delete tempSides["right"];
        } else if (
            this.position.x === this.maze.cols - 1 &&
            this.position.y === this.maze.rows - 1
        ) {
            delete tempSides["right"];
            delete tempSides["bottom"];
        } else if (this.position.x === 0) {
            delete tempSides["left"];
        } else if (this.position.y === 0) {
            delete tempSides["top"];
        } else if (this.position.x === this.maze.cols - 1) {
            delete tempSides["right"];
        } else if (this.position.y === this.maze.rows - 1) {
            delete tempSides["bottom"];
        }

        // Перевірка сусідніхи клітин
        this.maze.passedCells.forEach((e) => {
            if (
                e.position.x === this.position.x &&
                e.position.y === this.position.y + 1
            ) {
                // Bottom cell
                delete tempSides["bottom"];
            } else if (
                e.position.x === this.position.x &&
                e.position.y === this.position.y - 1
            ) {
                // Top Cell
                delete tempSides["top"];
            } else if (
                e.position.x === this.position.x + 1 &&
                e.position.y === this.position.y
            ) {
                // Right cell
                delete tempSides["right"];
            } else if (
                e.position.x === this.position.x - 1 &&
                e.position.y === this.position.y
            ) {
                // Left cell
                delete tempSides["left"];
            }
        });

        return randomProperty(tempSides);
    }

    moveTo(vector) {
        this.position.x += vector.x;
        this.position.y += vector.y;

        this.html.style.inset = `${3 + this.position.y * 20}px 0 0 
                                ${3 + this.position.x * 20}px`;
    }
}

const maze = new Maze(15, 15);
const generator = new Generator({ x: 0, y: 0 });
maze.render();



startBtn.addEventListener("click", () => {
    maze.setGenerator(generator);
    maze.generate();
    maze.generateEntrance();
})
// TODO:
// Multiple generator
// Rewrite on grid-layout
// Generate with generator or without
// робити кілька масивів для пройдених і не пройдених клітин чи організовувати все через один масив? (Наразі через два)
