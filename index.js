const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1080
canvas.height = 600
// 34 tiles tall

const collisionsMap = []
for (let i = 0; i < collisions.length; i+= 60){
    collisionsMap.push(collisions.slice(i, i+60))
}

const battleZonesMap = []
for (let i = 0; i < battleZonesData.length; i+= 60){
    battleZonesMap.push(battleZonesData.slice(i, i+60))
}


class Boundary {
    static width = 32
    static height = 32
    constructor({position}) {
        this.position = position
        this.width = 32
        this.height = 32
    }
    // comment out if you dont want collisions / battlezones
    draw() {
        //c.fillStyle = 'red'
        //c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }
}

const boundaries = []
const offset = {
    x: -96,
    y: -96
}

collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol == 213){
            boundaries.push(new Boundary({position: {
                x: j * Boundary.width + offset.x,
                y: i * Boundary.height + offset.y
            }}))
        }
        
    })
})

const battleZones = []

battleZonesMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol == 220){
            battleZones.push(new Boundary({position: {
                x: j * Boundary.width + offset.x,
                y: i * Boundary.height + offset.y
            }}))
        }
        
    })
})

console.log(battleZones)


const image = new Image()
image.src = './imgs/map.png'

const playerDownImage = new Image()
playerDownImage.src = './imgs/playerDown.png'

const playerUpImage = new Image()
playerUpImage.src = './imgs/playerUp.png'

const playerLeftImage = new Image()
playerLeftImage.src = './imgs/playerLeft.png'

const playerRightImage = new Image()
playerRightImage.src = './imgs/playerRight.png'

class Sprite {
    constructor({ position, image, frames = { max: 1}, sprites }) {
        this.position = position
        this.image = image
        this.frames = {...frames, val: 0, elapsed: 0}

        this.image.onload = () => {
            this.width = this.image.width / this.frames.max
            this.height = this.image.height
        }
        this.moving = false
        this.sprites = sprites
    }

    draw() {
        c.drawImage(
            this.image, 
            this.frames.val * this.width,
            0,
            this.image.width / this.frames.max,
            this.image.height,
            this.position.x,
            this.position.y,
            this.image.width / this.frames.max,
            this.image.height
        )

        if (!this.moving) return

        if (this.frames.max > 1) {
            this.frames.elapsed++
        }

        if (this.frames.elapsed % 10 === 0)
        if (this.frames.val < this.frames.max - 1) this.frames.val++
        else this.frames.val = 0
    }
}

const player = new Sprite({
    position: {
        x:canvas.width / 2 - (192) / 2,
        y:canvas.height / 2 - 68 / 2
    },
    image: playerDownImage,
    frames: {
        max: 4
    },
    sprites: {
        up: playerUpImage,
        left: playerLeftImage,
        right: playerRightImage,
        down: playerDownImage
    }
})

const background = new Sprite({position: {
    x: offset.x,
    y: offset.y}, 
    image: image
})

const keys = {
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    }
}

const movables = [background, ...boundaries, ...battleZones]

function rectangularCollision({rectangle1, rectangle2}){
    return (rectangle1.position.x + rectangle1.width >= rectangle2.position.x && 
        rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y <= rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y)
}

const battle = {
    initiated: false
}

function animate() {
    const animationId = window.requestAnimationFrame(animate)
    background.draw()
    boundaries.forEach(boundary => {
        boundary.draw()
    })
    battleZones.forEach(battleZone => {
        battleZone.draw()
    })
    player.draw()
    
    let moving = true
    player.moving = false


    if (battle.initiated) return

    if (keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed) {
        for (let i = 0; i < battleZones.length; i++){
            const battleZone = battleZones[i]
            //const overlappingArea = (Math.min(player.position.x + player.width, battleZone.position.x + battleZone.width) - Math.max(player.position.x, battleZone.position.x)) * (Math.min(player.position.y + player.height, battleZone.position.y + battleZone.height) - Math.max(player.position.y, battleZone.position.y))
            if (rectangularCollision({
                rectangle1: player,
                rectangle2: battleZone
            }) && Math.random() < 0.01 //&& overlappingArea > (player.width * player.height) / 2
            ){
                console.log('activate battle')
                window.cancelAnimationFrame(animationId)

                battle.initiated = true
                gsap.to('#overlappingDiv', {
                    opacity: 1,
                    repeat: 3,
                    yoyo: true,
                    duration: 0.4,
                    onComplete(){
                        gsap.to('#overlappingDiv', {
                            opacity:1 ,
                            duration: 0.4,
                            onComplete(){
                                animateBattle()
                                gsap.to('#overlappingDiv', {
                                    opacity:0,
                                    duration: 0.4,
                                }) 
                            }
                        })
                    }
                })
                break
            }
        }
    }

    if (keys.w.pressed && lastKey === 'w'){ 
        player.moving = true
        player.image = player.sprites.up

        for (let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i]
            if (rectangularCollision({
                rectangle1: player,
                rectangle2: {...boundary, position: {
                    x: boundary.position.x,
                    y: boundary.position.y + 5
                }
            }
            })
            ){
                moving = false
                break
            }
        }


        if (moving) movables.forEach(movable => {movable.position.y += 3})
    }
    else if (keys.a.pressed && lastKey === 'a'){ 
        player.moving = true
        player.image = player.sprites.left
        for (let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i]
            if (rectangularCollision({
                rectangle1: player,
                rectangle2: {...boundary, position: {
                    x: boundary.position.x + 5,
                    y: boundary.position.y
                }
            }
            })
            ){
                moving = false
                break
            }
        }

        if (moving) movables.forEach(movable => {movable.position.x += 3})
    }
    else if (keys.s.pressed && lastKey === 's'){
        player.moving = true
        player.image = player.sprites.down
        for (let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i]
            if (rectangularCollision({
                rectangle1: player,
                rectangle2: {...boundary, position: {
                    x: boundary.position.x,
                    y: boundary.position.y - 5
                }
            }
            })
            ){
                moving = false
                break
            }
        }

        if (moving) movables.forEach(movable => {movable.position.y -= 3})
    }
    else if (keys.d.pressed && lastKey === 'd'){
        player.moving = true
        player.image = player.sprites.right
        for (let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i]
            if (rectangularCollision({
                rectangle1: player,
                rectangle2: {...boundary, position: {
                    x: boundary.position.x - 5,
                    y: boundary.position.y
                }
            }
            })
            ){
                moving = false
                break
            }
        }

        if (moving) movables.forEach(movable => {movable.position.x -= 3})
    }
}
animate()

const battleBackgroundImage = new Image()
battleBackgroundImage.src = './imgs/battleBackground.png'
const battleBackground = new Sprite({
    position: {
    x: 0,
    y: 0
    },
    image: battleBackgroundImage
})

function animateBattle(){
    window.requestAnimationFrame(animateBattle)
    battleBackground.draw()

}

let lastKey = ''
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'w':
            keys.w.pressed = true
            lastKey = 'w'
            break
        case 'a':
            keys.a.pressed = true
            lastKey = 'a'
            break
        case 's':
            keys.s.pressed = true
            lastKey = 's'
            break
        case 'd':
            keys.d.pressed = true
            lastKey = 'd'
            break
    }
})

window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w':
            keys.w.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
        case 's':
            keys.s.pressed = false
            break
        case 'd':
            keys.d.pressed = false
            break
    }
})