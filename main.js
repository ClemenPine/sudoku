const GRID_SIZE = 3
const CELL_COUNT = GRID_SIZE ** 4
const NUM_COUNT = GRID_SIZE ** 2
const MAX_TRIES = 10_000

let grid
let history

Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
}

class Cell {
    constructor(pos) {
        this.mini = Math.floor(pos / 9)
        this.row = 3 * Math.floor(this.mini / 3) + Math.floor(pos % 9 / 3)
        this.col = 3 * (this.mini % 3) + pos % 3
    }
}

class Grid {
    constructor() {
        this.options = []
        this.unplaced = new Set()
        
        for (let i=0; i < CELL_COUNT; i++) {
            const nums = new Set()
            for (let j=0; j < NUM_COUNT; j++) {
                nums.add(j + 1)
            }

            this.options.push(nums)
            this.unplaced.add(i)
        }
    }

    clone() {
        const clone = new Grid()

        clone.options = this.options.map(x => new Set([...x]))
        clone.unplaced = new Set([...this.unplaced])

        return clone
    }

    findMins() {
        let mins = []
        let minSize = NUM_COUNT

        for (const cell of this.unplaced) {
            const nums = this.options[cell]

            if (nums.size == minSize) {
                mins.push(cell)
            } else if (nums.size < minSize) {
                mins = [cell]
                minSize = nums.size
            }
        }

        return mins
    }

    collapse(minCell, cellVal) {
        this.options[minCell] = new Set([cellVal])
        this.unplaced.delete(minCell)

        const minData = new Cell(minCell)
        for (const cell of this.unplaced) {
            const cellData = new Cell(cell) 

            if (
                cellData.row == minData.row ||
                cellData.col == minData.col ||
                cellData.mini == minData.mini
            ) {
                this.options[cell].delete(cellVal)
            }

            if (!this.options[cell].size) {
                this.unplaced.delete(cell)
            }
        }
    }

    stepSolve() {
        const mins = this.findMins()

        if (mins.length) {
            const minCell = mins.random()
            const cellVal = [...this.options[minCell]].random()

            this.collapse(minCell, cellVal)
        }

        return mins.length && 1
    }
}

class History {
    constructor(grid) {
        this.tape = []
        this.index = -1
        this.grid = grid
        this.update(grid)
    }

    undo() {
        this.index = Math.max(0, this.index - 1)
        this.grid = this.tape[this.index].clone()
    }

    redo() {
        this.index = Math.min(this.index + 1, this.tape.length - 1)
        this.grid = this.tape[this.index].clone()
    }

    update() {
        this.tape = this.tape.slice(0, this.index + 1)
        this.tape.push(this.grid.clone())
        this.index++
    }
}

function renderGrid() {
    for (const [i, cellNode] of Object.entries(document.getElementsByClassName("cell"))) {
        const nums = history.grid.options[i]

        if (nums.size == 0) {
            cellNode.classList.add("bg-rose-200")
        } else {
            cellNode.classList.remove("bg-rose-200")
        }

        cellNode.classList.remove("text-2xl")
        if (nums.size == 1 && !history.grid.unplaced.has(parseInt(i))) {
            cellNode.innerHTML = [...nums][0]
            cellNode.classList.add("text-2xl")
            continue
        } 

        if (!cellNode.firstElementChild) {
            const valNode = valTemp.cloneNode(true)
            valNode.removeAttribute("id")
    
            for (const [j, buttonNode] of Object.entries(valNode.children)) {
                buttonNode.addEventListener("click", function() {
                    history.grid.collapse(parseInt(i), parseInt(j) + 1)
                    setGrid()
                })
            }
    
            cellNode.innerHTML = ""
            cellNode.appendChild(valNode)
        }

        for (const [i, valNode] of Object.entries(cellNode.firstElementChild.children)) {
            if (nums.has(parseInt(i) + 1)) {
                valNode.removeAttribute("disabled")
            } else {
                valNode.setAttribute("disabled", true)
            }
        }
    }
}

function setGrid() {
    history.update()
    renderGrid()
}

window.undoHistory = function() {
    history.undo()
    renderGrid()
}

window.redoHistory = function() {
    history.redo()
    renderGrid()
}

window.newGrid = function() {
    grid = new Grid()
    history = new History(grid)

    const valTemp = document.getElementById("valTemp")
    for (const [i, cellNode] of Object.entries(document.getElementsByClassName("cell"))) {
        const valNode = valTemp.cloneNode(true)
        valNode.removeAttribute("id")

        for (const [j, buttonNode] of Object.entries(valNode.children)) {
            buttonNode.addEventListener("click", function() {
                history.grid.collapse(parseInt(i), parseInt(j) + 1)
                valNode.classList.add("text-sky-300")
                setGrid()
            })
        }

        cellNode.innerHTML = ""
        cellNode.appendChild(valNode)
        cellNode.classList.remove("bg-rose-200")
    }
}

window.stepGrid = function() {
    if (history.grid.stepSolve()) {
        setGrid()
    }
}

window.solveGrid = function() {
    let grid
    for (let i=0; i < MAX_TRIES; i++) {
        grid = history.tape[history.index].clone()
        
        while (grid.unplaced.size) {
            grid.stepSolve()
        }
        
        if (!grid.options.some(x => x.size == 0)) {
            break
        }
    }

    history.grid = grid
    setGrid()
}

window.onload = function() {
    newGrid()
}