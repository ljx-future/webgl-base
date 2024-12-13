const matrixType = {
  identity: math.matrix([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]),
  translate: (dx, dy, dz)=>math.matrix([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [dx, dy, dz, 1]
  ]),
  rotate: {
    x: (sin,cos)=>math.matrix([
      [1,  0,    0,  0],
      [0,  cos, sin, 0],
      [0, -sin, cos, 0],
      [0,  0,    0,  1]
    ]),
    y:(sin,cos)=>math.matrix([
      [cos,  0, -sin,  0],
      [0,    1,   0,   0],
      [sin,  0,  cos,  0],
      [0,    0,   0,   1],
    ]),
    z:(sin,cos)=>math.matrix([
      [cos, sin,  0,  0],
      [-sin, cos,  0,  0],
        [0,   0,   1,  0],
        [0,   0,   0,  1]
    ])
  },
  scale:(sx, sy, sz)=>math.matrix([
    [sx, 0, 0, 0],
    [0, sy, 0, 0],
    [0, 0, sz, 0],
    [0, 0, 0, 1]
  ])
}
const matrixAction = {
  translate: (...args) => {
   return matrixType['translate'](...args)
  },
  rotate: (ANGLT,x,y,z) => {
    // 将旋转图形所需的数据传递给顶点着色器
    let radian = Math.PI * ANGLT / 180.0  //转为弧度制
    const cos = Math.cos(radian)
    const sin = Math.sin(radian)
    let matrixData
    if (x == 1) {
      matrixData = matrixType['rotate']['x'](sin,cos)
    }
    if (y == 1) {
      matrixData = matrixType['rotate']['y'](sin,cos)
    }
    if (z == 1) {
      matrixData = matrixType['rotate']['z'](sin,cos)
    }
    return matrixData
  },
  scale: (...args) => {
    return matrixType['scale'](...args)
  }
}

export default class Matrix4 {
  matrixArr =  math.matrix([])
  get matrix() {
    let arr = []
    this.matrixArr.forEach(item=>{
      arr.push(item)
    })
    return new Float32Array(arr)
  }
  constructor() {
    this.matrixArr = matrixType['identity']
  }
  translate(dx, dy, dz) {
    // 位移距离
    const matrixData = matrixAction['translate'](dx, dy, dz)
    this.matrixArr = math.multiply(this.matrixArr,matrixData)
  }
  rotate(ANGLT,x,y,z) {
    const matrixData = matrixAction['rotate'](ANGLT,x,y,z)
    this.matrixArr = math.multiply(this.matrixArr,matrixData)
  }
  scale(sx, sy, sz) {
    // 缩放倍数
    const matrixData = matrixAction['scale'](sx, sy, sz)
    this.matrixArr = math.multiply(this.matrixArr,matrixData)
  }
  setTranslate(dx, dy, dz) {
    // 位移距离
    this.matrixArr = matrixAction['translate'](dx, dy, dz)
  }
  setRotate(ANGLT,x,y,z) {
    this.matrixArr = matrixAction['rotate'](ANGLT,x,y,z)
  }
  setScale(sx, sy, sz) {
    // 缩放倍数
    this.matrixArr = matrixAction['scale'](sx, sy, sz)
  }
}
