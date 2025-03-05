const matrixType = {
    identity: math.matrix([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]),
    translate: (dx, dy, dz) => math.matrix([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [dx, dy, dz, 1]]),
    rotate: {
        x: (sin, cos) => math.matrix([[1, 0, 0, 0], [0, cos, sin, 0], [0, -sin, cos, 0], [0, 0, 0, 1]]),
        y: (sin, cos) => math.matrix([[cos, 0, -sin, 0], [0, 1, 0, 0], [sin, 0, cos, 0], [0, 0, 0, 1],]),
        z: (sin, cos) => math.matrix([[cos, sin, 0, 0], [-sin, cos, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])
    },
    scale: (sx, sy, sz) => math.matrix([[sx, 0, 0, 0], [0, sy, 0, 0], [0, 0, sz, 0], [0, 0, 0, 1]])
}
const matrixAction = {
    translate: (...args) => {
        return matrixType['translate'](...args)
    },
    rotate: (ANGLT, x, y, z) => {
        // 将旋转图形所需的数据传递给顶点着色器
        let radian = Math.PI * ANGLT / 180.0  //转为弧度制
        const cos = Math.cos(radian)
        const sin = Math.sin(radian)
        let matrixData = []
        if (x == 1) {
            matrixData.push(matrixType['rotate']['x'](sin, cos))
        }
        if (y == 1) {
            matrixData.push(matrixType['rotate']['y'](sin, cos))
        }
        if (z == 1) {
            matrixData.push(matrixType['rotate']['z'](sin, cos))
        }
        return matrixData
    },
    scale: (...args) => {
        return matrixType['scale'](...args)
    }
}

export default class Matrix4 {
    matrixArr = math.matrix([])

    get matrix() {
        let arr = []
        this.matrixArr.forEach(item => {
            arr.push(item)
        })
        return new Float32Array(arr)
    }

    constructor() {
        this.matrixArr = matrixType['identity']
    }

    set(matrix) {
        this.matrixArr = matrix.matrixArr;
        return this;
    }

    multiply(matrixData) {
        this.matrixArr = math.multiply(matrixData.matrixArr, this.matrixArr)
        return this;
    }
    multiplyVector4(arr) {
        const matrixData = math.matrix(arr)
        this.matrixArr = math.multiply(matrixData, this.matrixArr)
        return this;
    }

    translate(dx, dy, dz) {
        // 位移距离
        const matrixData = matrixAction['translate'](dx, dy, dz)
        this.matrixArr = math.multiply(matrixData, this.matrixArr)
    }

    rotate(ANGLT, x, y, z) {
        const list = matrixAction['rotate'](ANGLT, x, y, z)
        list.forEach((item) => {
            this.matrixArr = math.multiply(item, this.matrixArr)
        })
    }

    scale(sx, sy, sz) {
        // 缩放倍数
        const matrixData = matrixAction['scale'](sx, sy, sz)
        this.matrixArr = math.multiply(matrixData, this.matrixArr)
    }

    // 设置观察矩阵
    lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
        const eye = [eyeX, eyeY, eyeZ];
        const center = [centerX, centerY, centerZ];
        const up = [upX, upY, upZ];

        const f = normalize(subtractVectors(center, eye));
        const s = normalize(cross(f, up));
        const u = cross(s, f);
        this.matrixArr = math.multiply(math.matrix([[s[0], u[0], -f[0], 0], [s[1], u[1], -f[1], 0], [s[2], u[2], -f[2], 0], [-dot(s, eye), -dot(u, eye), dot(f, eye), 1]]), this.matrixArr);
    }
    // 转置矩阵
    transpose() {
        this.matrixArr = math.transpose(this.matrixArr)
    };
    setTranslate(dx, dy, dz) {
        // 位移距离
        this.matrixArr = matrixAction['translate'](dx, dy, dz)
    }

    setRotate(ANGLT, x, y, z) {
        const list = matrixAction['rotate'](ANGLT, x, y, z)
        if (list.length > 1) {
            list.forEach((item, index) => {
                if (index == 0) {
                    this.matrixArr = item
                } else {
                    this.matrixArr = math.multiply(item, this.matrixArr)
                }
            })
        } else {
            this.matrixArr = list[0]
        }
    }

    setScale(sx, sy, sz) {
        // 缩放倍数
        this.matrixArr = matrixAction['scale'](sx, sy, sz)
    }

    // 设置观察矩阵
    setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
        const eye = [eyeX, eyeY, eyeZ];
        const center = [centerX, centerY, centerZ];
        const up = [upX, upY, upZ];

        const f = normalize(subtractVectors(center, eye));
        const s = normalize(cross(f, up));
        const u = cross(s, f);
        this.matrixArr = math.matrix([[s[0], u[0], -f[0], 0], [s[1], u[1], -f[1], 0], [s[2], u[2], -f[2], 0], [-dot(s, eye), -dot(u, eye), dot(f, eye), 1]]);
    }

    // 设置正射投影矩阵
    setOrtho(left, right, bottom, top, near, far) {
        let rw, rh, rd;
        if (left === right || bottom === top || near === far) {
            throw 'null frustum';
        }
        rw = 1 / (right - left);
        rh = 1 / (top - bottom);
        rd = 1 / (far - near);

        this.matrixArr = math.matrix([[2 * rw, 0, 0, 0], [0, 2 * rh, 0, 0], [0, 0, -2 * rd, 0], [-(right + left) * rw, -(top + bottom) * rh, -(far + near) * rd, 1]])
    }

    // 设置透视投影矩阵
    setPerspective(fovy, aspect, near, far) {
        let rd, s, ct;

        if (near === far || aspect === 0) {
            throw 'null frustum';
        }
        if (near <= 0) {
            throw 'near <= 0';
        }
        if (far <= 0) {
            throw 'far <= 0';
        }

        fovy = Math.PI * fovy / 180 / 2;
        s = Math.sin(fovy);
        if (s === 0) {
            throw 'null frustum';
        }

        rd = 1 / (far - near);
        ct = Math.cos(fovy) / s;
        this.matrixArr = math.matrix([[ct / aspect, 0, 0, 0], [0, ct, 0, 0], [0, 0, -(far + near) * rd, -1], [0, 0, -2 * near * far * rd, 0]])
    }
    // 逆矩阵
    setInverseOf(matrix) {
        this.matrixArr = math.inv(matrix.matrixArr)
        return this
    }
}

function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v) {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / length, v[1] / length, v[2] / length];
}

function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}