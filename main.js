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

const example = [
    ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
    ["0", " ", " ", " ", " ", " ", " ", " ", " ", "0"],
    ["0", " ", " ", " ", " ", " ", " ", "0", "0", "0"],
    ["0", " ", " ", " ", " ", "0", "0", "0", " ", " "],
    ["0", "0", "0", "0", "0", "0", "0", "0", " ", "0"],
    ["0", " ", " ", " ", " ", " ", " ", " ", " ", "0"],
    ["0", " ", "0", "0", "0", "0", "0", "0", "0", "0"],
    ["0", " ", "0", " ", " ", " ", " ", " ", " ", "0"],
    ["0", " ", "0", " ", " ", " ", " ", " ", " ", "0"],
    ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
];

const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const colsBtn = document.getElementById("cols-btn");
const rowsBtn = document.getElementById("rows-btn");
const speedBtn = document.getElementById("speed-btn");
const progressBar = document.getElementById("progress-bar");
const entrancesBtn = document.getElementById("entrances-btn");
const generatorsBtn = document.getElementById("generators-btn");
const generatorsList = document.querySelector(".generators__list");
const findEntrancesBtn = document.getElementById("findEntrances-btn");

const maxCols = 100;
const maxRows = 100;
const maxSpeed = 10000;
let findingEntrances = findEntrancesBtn.checked;

const rows = parseInt(rowsBtn.value) || 15;
const cols = parseInt(colsBtn.value) || 15;
let amountEntrances = parseInt(entrancesBtn.value) || 1;

// let generator = new Generator({ x: 0, y: 0 });
let generatorsItemX;
let generatorsItemY;
let generators = [];

// Variables End

// Functions Start
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

const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
    // The maximum is exclusive and the minimum is inclusive
};

function downloadObject(exportObj, exportName, fileType = "json") {
    if (!exportObj || !exportName || !fileType) {
        console.error("DOWNLOAD UNDEFINED DATA");
        return;
    }
    const encodedURI = encodeURIComponent(
        fileType === "txt" ? exportObj : JSON.stringify(exportObj)
    );
    const dataStr = `data:text/json;charset=utf-8,` + encodedURI;
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.href = dataStr;
    downloadAnchorNode.download = exportName + "." + fileType;
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

const toggleStartBtnName = () => {
    if (startBtn.textContent.toLowerCase() === "start") {
        startBtn.textContent = "stop";
    } else if (startBtn.textContent.toLowerCase() === "stop") {
        startBtn.textContent = "start";
    }
};

const validate = (btn, defaultValue, condition) => {
    if (
        !parseInt(btn.value) ||
        parseInt(btn.value) <= 0 ||
        parseInt(btn.value) > condition
    ) {
        btn.value = defaultValue;
    }
};

const updateGeneratorsList = () => {
    const endIteration = parseInt(generatorsBtn.value);
    let startIteration = generatorsItemX ? generatorsItemX.length : 0;

    // let generatorX = i % maze.rows;
    // let generatorY = Math.floor(i / maze.rows);

    // Deletion Generators From List
    if (startIteration > parseInt(generatorsBtn.value)) {
        for (let i = startIteration - 1; i >= endIteration; i--) {
            generators.pop();
            generatorsItemX[i].remove();
            generatorsItemY[i].remove();
        }
    }
    // Adding Generators in List
    for (let i = startIteration; i < endIteration; i++) {
        let generatorX;
        let generatorY;
        let occupiedGenerator = true;

        while (occupiedGenerator) {
            generatorX = getRandomInt(0, maze.cols);
            generatorY = getRandomInt(0, maze.rows);
            occupiedGenerator = generators.find(
                (g) =>
                    generatorX === g.position.x && generatorY === g.position.y
            );
        }

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

    // Update Variable List
    generatorsItemX = generatorsList.querySelectorAll(".generators__item-x");
    generatorsItemY = generatorsList.querySelectorAll(".generators__item-y");
};
// Functions End

// Class Start
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
                generator.position.x + generator.position.y * this.cols;
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

        if (
            (this.entrances.some((e) => !e.passed) || !findingEntrances) &&
            this.cells.some((e) => !e.passed)
        ) {
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
            // maze.downloadAsJSON();
            maze.downloadAsText();
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

    downloadAsJSON() {
        const tempJSON = {
            cells: this.cells,
            passedCells: this.passedCells,
            entrances: this.entrances,
        };

        downloadObject(tempJSON, "maze", "json");
    }

    downloadAsText() {
        let mazeText = "";
        const mazeArr = [];
        let cellIndex, currCell;
        const wallSign = 1;
        const cellSign = " ";
        const mazeLastRow = new Array(21).fill(wallSign);
        for (let i = 0; i < this.rows; i++) {
            let tempArr = [];
            for (let j = 0; j < this.cols; j++) {
                cellIndex = j + i * this.cols;
                currCell = this.cells[cellIndex];

                tempArr.push(wallSign);
                tempArr.push(currCell.borders.top ? wallSign : cellSign);
                if (i === this.rows - 1 && !currCell.borders.bottom) {
                    mazeLastRow[j * 2] = cellSign;
                }
            }
            tempArr.push(wallSign);
            mazeArr.push(tempArr);

            tempArr = [];

            tempArr.push(wallSign);

            for (let j = 0; j < this.cols; j++) {
                cellIndex = j + i * this.cols;
                currCell = this.cells[cellIndex];
                tempArr.push(cellSign);
                tempArr.push(currCell.borders.right ? wallSign : cellSign);
                if (j === 0 && !currCell.borders.left) {
                    tempArr[j] = cellSign;
                }
            }
            mazeArr.push(tempArr);
        }
        mazeArr.push(mazeLastRow);

        mazeArr.forEach((row) => {
            mazeText += row.join(" ") + "\n";
        });

        const mazeObj = {
            cells: mazeArr,
            startPositions: maze.generators.map((g) => g.startPos),
        };

        console.log(mazeText);
        downloadObject(mazeArr, "maze", "json");
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
// Class End

// Entry Point Start
let maze = new Maze(rows, cols);
maze.instantly = true;
maze.render();
// maze.setGenerators(generators);
maze.generateEntrances(amountEntrances);
// Entry Point End

// Listeners Start
startBtn.addEventListener("click", () => {
    maze.generating = !maze.generating;
    maze.generate();

    toggleStartBtnName();
});

document.body.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        validate(speedBtn, "300", maxSpeed);

        maze.stepSpeed = parseInt(speedBtn.value);
        generators.forEach((gener) => {
            gener.html.style.transitionDuration = speedBtn.value + "ms";
        });

        //Generators
        validate(generatorsBtn, 1, maze.rows * maze.cols);
        updateGeneratorsList();
    }
});

speedBtn.addEventListener("focusout", () => {
    validate(speedBtn, "300", maxSpeed);

    maze.stepSpeed = parseInt(speedBtn.value);
    generators.forEach((gener) => {
        gener.html.style.transitionDuration = speedBtn.value + "ms";
    });
});

resetBtn.addEventListener("click", () => {
    // Update finding entrances state
    findingEntrances = findEntrancesBtn.checked;

    // Cols and rows
    startBtn.textContent = "start";

    validate(colsBtn, 15, maxCols);
    validate(rowsBtn, 15, maxRows);

    maze.rows = parseInt(rowsBtn.value);
    maze.cols = parseInt(colsBtn.value);
    // Entrances
    validate(entrancesBtn, 1, (maze.rows + maze.cols) * 2);

    amountEntrances = parseInt(entrancesBtn.value);

    // Generators
    generatorsItemX &&
        generatorsItemX.forEach((e, i) => {
            validate(e, 0, maze.cols - 1);
            generators[i].startPos.x = parseInt(e.value);
        });

    generatorsItemY &&
        generatorsItemY.forEach((e, i) => {
            validate(e, 0, maze.rows - 1);
            generators[i].startPos.y = parseInt(e.value);
        });

    updateGeneratorsList();

    // Reset
    generators.forEach((gener) => {
        gener.reset();
    });
    maze.reset();
    maze.render();
    maze.setGenerators(generators);
    maze.generateEntrances(amountEntrances);
});

// downloadObjectAsJson("1 1 1 1 1 1\n1 1 1 1 1\n 1 1 1 1\n1 1 1\n 1 1 \n 1\n");

// Listeners End

// TODO:
// export (json, text, image)
// entrances in any position(not only from the side)
// arbitary form of maze
// visual constructor for maze?
// another algorithms
// form as library

// add option for instantly complete,
// add option randomize position for generators,
// add option custom positions for entrances,
// add option for export data
// stop when have found entrance(entrances) - done
// random position of generators(randoms option) - done
// option(entrances, generators) - done
// multiply entrances - done
// Multiple generator - done
// Button stop and start - done
// procents of completing - done
// setting of speed - done
// instant completing - done

// BUGS:
// при кількості більше одного генератора, кожен генератор формує свою згенеровану закриту кімнату
// оновлювати позицію рандомнізованих генераторів, якщо змінились розміра поля
// помилка, при проходженні поля, де колонки або стовпці = 1
// пересичення стеку виклику, якщо поле завелике, а генераторів мало

// зміщення початкових позицій пройдених клітинок при зміні кількості рядків - done
