const SIDES = {
    top: 0,
    right: 1,
    bottom: 2,
    left: 3,
};
const sidesKeys = Object.keys(SIDES);

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

const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const colsBtn = document.getElementById("cols-btn");
const rowsBtn = document.getElementById("rows-btn");
const speedBtn = document.getElementById("speed-btn");
const progressBar = document.getElementById("progress-bar");
const entrancesBtn = document.getElementById("entrances-btn");
const generatorsBtn = document.getElementById("generators-btn");
const generatorsList = document.querySelector(".generators__list");

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
        this.entrances = [];
        this.generators = [];
        this.generated = false;
        this.generating = false;
        this.rendered = false;
        this.instantly = false;
        this.stepSpeed = 300;
        this.progress = 0;
    }

    render() {
        let mazeHtml = document.querySelector("table.maze");
        if (mazeHtml) {
            mazeHtml.remove();
        }
        mazeHtml = `<table class="maze">`;

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
        this.rendered = true;
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
        // console.log("cell elem: ", cellElem);
    }

    setGenerators(generators) {
        if (!generators.length) return;

        const areAllGenerators = generators.every(
            (generator) => generator instanceof Generator
        );
        if (!areAllGenerators) return;

        this.generators = generators;
        this.generators.forEach((generator) => {
            generator.maze = this;
            const mazeHtml = this.parent.querySelector(".maze");
            const cellIndex =
                generator.position.x + generator.position.y * this.rows;
            this.setCellPassed(cellIndex);

            mazeHtml.insertAdjacentElement("afterbegin", generator.html);
        });
    }

    generate() {
        if (!this.rendered) return;
        if (!this.generating) return;
        if (this.generated) return;
        this.generators.forEach((generator) => {
            // Отримуємо сторону наступного кроку
            const nextSide = generator.getNextSide();

            if (nextSide) {
                generator.takenPath.push({
                    ...generator.position,
                });
                // Індекс клітиин до кроку
                const pastCellIndex =
                    generator.position.x + generator.position.y * this.cols;

                // Робимо крок
                generator.moveTo(moveVector[nextSide.value]);

                // Індекс поточної клітини
                const cellIndex =
                    generator.position.x + generator.position.y * this.cols;

                // Позначаємо клітинку пройденою
                this.setCellPassed(cellIndex);
                // Оновлюємо межі
                this.updateCellBorder(pastCellIndex, nextSide.key);
                this.updateCellBorder(cellIndex, oppositeSide[nextSide.key]);

                // Оновлюємо відсоток прогресу
                this.progress =
                    (this.passedCells.length * 100) / this.cells.length;
                progressBar.value = Math.round(this.progress);
            } else {
                if (!generator.takenPath.length) return;
                const lastPosition = generator.takenPath.pop();
                const backMoveVector = {
                    x: lastPosition.x - generator.position.x,
                    y: lastPosition.y - generator.position.y,
                };

                generator.moveTo(backMoveVector);
            }
        });

        if (this.cells.some((e) => !e.passed)) {
            if (this.instantly) {
                this.generate();
            } else {
                setTimeout(() => {
                    this.generate();
                }, this.stepSpeed);
            }
        } else {
            this.generated = true;
            console.log("GENERATING HAVE BEEN FINISHED");
        }
    }

    generateEntrances(amount = 1) {
        for (let i = 0; i < amount; i++) {
            const randomRow = Math.floor(Math.random() * this.rows);
            const randomCol = Math.floor(Math.random() * this.cols);

            let randomSide =
                sidesKeys[Math.floor(Math.random() * sidesKeys.length)];

            let cellIndex;

            if (randomSide === "top") {
                cellIndex = randomCol;
            } else if (randomSide === "bottom") {
                cellIndex = this.cols * (this.rows - 1) + randomCol;
            } else if (randomSide === "left") {
                cellIndex = randomRow * this.cols;
            } else if (randomSide === "right") {
                cellIndex = randomRow * this.cols + (this.cols - 1);
            }

            if (this.entrances.includes(this.cells[cellIndex])) {
                i--;
            } else {
                this.entrances.push(this.cells[cellIndex]);
                this.updateCellBorder(cellIndex, randomSide);
            }
        }
    }

    reset() {
        this.cells = [];
        this.passedCells = [];
        this.entrances = [];
        this.generators = [];
        this.progress = 0;
        progressBar.value = Math.round(this.progress);
        this.generated = false;
        this.generating = false;
        this.rendered = false;
    }
}

class Generator {
    constructor(position = { x: 0, y: 0 }) {
        this.position = position;
        this.maze;
        this.takenPath = [];
        this.startPos = { ...position };
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

    reset(position) {
        this.takenPath = [];
        this.position = position || { ...this.startPos };
        this.html.style.inset = `${3 + this.position.y * 20}px 0 0 
        ${3 + this.position.x * 20}px`;
    }
}

const toggleStartBtnName = () => {
    if (startBtn.textContent.toLowerCase() === "start") {
        startBtn.textContent = "stop";
    } else if (startBtn.textContent.toLowerCase() === "stop") {
        startBtn.textContent = "start";
    }
};

const rows = parseInt(rowsBtn.value) || 15;
const cols = parseInt(colsBtn.value) || 15;
let amountEntrances = parseInt(entrancesBtn.value) || 1;

let maze = new Maze(rows, cols);
// let generator = new Generator({ x: 0, y: 0 });
let generatorsItemX;
let generatorsItemY;
let generators = [];

maze.render();
// maze.setGenerators(generators);
maze.generateEntrances(amountEntrances);

startBtn.addEventListener("click", () => {
    maze.generating = !maze.generating;
    maze.generate();

    toggleStartBtnName();
});

document.body.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        if (
            !parseInt(speedBtn.value) ||
            parseInt(speedBtn.value) <= 0 ||
            parseInt(speedBtn.value) > 10000
        ) {
            speedBtn.value = "300";
        }
        maze.stepSpeed = parseInt(speedBtn.value);
        generators.forEach((gener) => {
            gener.html.style.transitionDuration = speedBtn.value + "ms";
        });

        //Generators
        if (
            !parseInt(generatorsBtn.value) ||
            parseInt(generatorsBtn.value) <= 0 ||
            parseInt(generatorsBtn.value) > maze.rows * maze.cols
        ) {
            generatorsBtn.value = 1;
        }
        // generators = [];

        let endIteration = parseInt(generatorsBtn.value);
        let startIteration = generatorsItemX ? generatorsItemX.length : 0;

        if (startIteration > parseInt(generatorsBtn.value)) {
            for (let i = startIteration - 1; i > endIteration; i--) {
                generators.pop();
                generatorsItemX[i].remove();
                generatorsItemY[i].remove();
            }
        }
        console.log(startIteration, endIteration);

        for (let i = startIteration; i < endIteration; i++) {
            console.log("added");
            const generatorX = i % maze.rows;
            const generatorY = Math.floor(i / maze.rows);
            let generatorsItem = document.createElement("li");
            generatorsItem.innerHTML = `
                        <input class="generators__item-x" type="number" min="0" max="${
                            maze.rows - 1
                        }" placeholder="X" value="${generatorX}"></input>
                        <input class="generators__item-y" type="number" min="0" max="${
                            maze.cols - 1
                        }" placeholder="Y" value="${generatorY}"></input>
                    `;
            generatorsList.appendChild(generatorsItem);
            generators.push(new Generator({ x: generatorX, y: generatorY }));
        }

        generatorsItemX = generatorsList.querySelectorAll(
            ".generators__item-x"
        );
        generatorsItemY = generatorsList.querySelectorAll(
            ".generators__item-y"
        );
    }
});

speedBtn.addEventListener("focusout", () => {
    if (
        !parseInt(speedBtn.value) ||
        parseInt(speedBtn.value) <= 0 ||
        parseInt(speedBtn.value) > 10000
    ) {
        speedBtn.value = "300";
    }
    maze.stepSpeed = parseInt(speedBtn.value);
    generators.forEach((gener) => {
        gener.html.style.transitionDuration = speedBtn.value + "ms";
    });
});

resetBtn.addEventListener("click", () => {
    // Cols and rows
    startBtn.textContent = "start";
    if (
        !parseInt(colsBtn.value) ||
        parseInt(colsBtn.value) <= 0 ||
        parseInt(colsBtn.value) > 100
    ) {
        colsBtn.value = 15;
    }

    if (
        !parseInt(rowsBtn.value) ||
        parseInt(rowsBtn.value) <= 0 ||
        parseInt(rowsBtn.value) > 100
    ) {
        rowsBtn.value = 15;
    }

    maze.rows = parseInt(rowsBtn.value);
    maze.cols = parseInt(colsBtn.value);

    // Entrances
    if (
        !parseInt(entrancesBtn.value) ||
        parseInt(entrancesBtn.value) <= 0 ||
        parseInt(entrancesBtn.value) > (maze.rows + maze.cols) * 2
    ) {
        entrancesBtn.value = 1;
    }
    amountEntrances = parseInt(entrancesBtn.value);

    // Generators
    generatorsItemX &&
        generatorsItemX.forEach((e, i) => {
            if (
                !parseInt(e.value) ||
                parseInt(e.value) <= 0 ||
                parseInt(e.value) > maze.cols - 1
            ) {
                e.value = 0;
            }
            console.log(generators);
            console.log(i);
            generators[i].startPos.x = parseInt(e.value);
        });

    generatorsItemY &&
        generatorsItemY.forEach((e, i) => {
            if (
                !parseInt(e.value) ||
                parseInt(e.value) <= 0 ||
                parseInt(e.value) > maze.rows - 1
            ) {
                e.value = 0;
            }
            generators[i].startPos.y = parseInt(e.value);
        });

    generators.forEach((gener) => {
        gener.reset();
    });

    // Reset
    maze.reset();
    maze.render();
    maze.setGenerators(generators);
    maze.generateEntrances(amountEntrances);
});

// TODO:
// option(entrances, generators) - one part of two
// random position of generators
// stop when have found entrance(entrances)
// export (json, text, image)
// multiply entrances - done
// Multiple generator - done
// Button stop and start - done
// procents of completing - done
// setting of speed - done
// instant completing - done
// form as library
// arbitary form of maze
// another algorithms
