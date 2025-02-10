// 顶点着色器
import {initShaders} from "../initShaders.js";
import Matrix4 from "../Matrix4.js";
let VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' +        // 法向量
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' +    // 模型矩阵 -- 进行变换
    'uniform mat4 u_NormalMatrix;\n' +    // 变换法向量的模型向量的逆转置矩阵
    'uniform vec3 u_LightColor;\n' +     // 光线颜色
    'uniform vec3 u_LightPosition;\n' + // 归一化的世界坐标 (in the world coordinate, normalized)
    'uniform vec3 u_AmbientLight;\n' +  // 环境光颜色
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position ;\n' +
    // 计算变换后的法向量并归一化
    '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    // 计算顶点的世界坐标
    '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
    // 计算光线方向并归一化
    '  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
    // 点乘 得出光线方向和法向量的夹角的cos值
    '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    // 计算漫反射光的颜色  = 光线颜色 * 基底颜色 * cos值
    '  vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;\n' +
    // 计算环境光产生的反射光颜色  = 环境光颜色 * 基底颜色
    '  vec3 ambient = u_AmbientLight * vec3(a_Color);\n' +
    // 将环境反射光和漫反射光相加得最终的颜色
    '  v_Color = vec4(diffuse + ambient, a_Color.a);\n' +
    '}\n';

// Fragment shader program
let FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

function main() {
    const canvas = document.getElementById('webgl');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('webgl supported');
        return;
    } else {
        // 初始化着色器
        if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
            console.log('failed')
            return
        }
        // 设置顶点位置正方形
        const n = initVertexBuffers(gl)
        if (n < 0) {
            console.log('设置顶点位置错误')
            return
        }
        // 设置背景色
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置清除颜色为黑色
        // 开启隐藏面消除功能
        gl.enable(gl.DEPTH_TEST);

        // 获取映射的变量
        let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
        let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
        let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
        let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
        let u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
        let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
        if (!u_MvpMatrix || !u_ModelMatrix || !u_LightColor || !u_LightPosition || !u_AmbientLight || !u_AmbientLight) {
            console.log('Failed to get the storage location');
            return;
        }

        // 光线颜色和点光源的位置
        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
        gl.uniform3f(u_LightPosition, 0.0,3.0,4.0);

        // 环境光颜色
        gl.uniform3f(u_AmbientLight,0.2,0.2,0.2)

        // 模型视图投影矩阵
        const mvpMatrix = new Matrix4()
        const vpMatrix = new Matrix4()
        const modelMatrix = new Matrix4()
        const normalMatrix = new Matrix4()

        vpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
        vpMatrix.lookAt(-7, 2.5, 6, 0, 0, 0, 0, 1, 0)
       // 根据模型矩阵计算用来变换法向量的矩阵


        let currentAngle = 0.0;  // Current rotation angle
        let tick = function() {
            currentAngle = animate(currentAngle);
            modelMatrix.setRotate(currentAngle, 0, 1, 0); // Rotate around the y-axis

            mvpMatrix.set(vpMatrix).multiply(modelMatrix)
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.matrix)
            // 根据模型矩阵计算用来变换法向量的矩阵
            // 得到模型矩阵的逆转置矩阵
            normalMatrix.setInverseOf(modelMatrix)
            normalMatrix.transpose()
            gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.matrix)
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.matrix)
            gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.matrix)
            // 清除深度缓冲区   深度缓冲区 也称Z缓冲区
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            // 绘制图形
            gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
            requestAnimationFrame(tick)
        }
        tick()
    }
}
// Rotation angle (degrees/second)
var ANGLE_STEP = 30.0;
// Last time that this function was called
var g_last = Date.now();
function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}
// 配置顶点位置
function initVertexBuffers(gl) {
    // 坐标
    let vertices = new Float32Array([
        // 正方体的顶点坐标
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,  // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,  // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,  // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0   // v4-v7-v6-v5 back
    ])
    let colors = new Float32Array([
        0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
        0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
        1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
        1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4,  // v1-v6-v7-v2 left 黄色
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  // v7-v4-v3-v2 down 白色
        0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0   // v4-v7-v6-v5 back 青色
    ])
    var normals = new Float32Array([    // Normal
        0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ]);
    // 索引
    let indices = new Uint8Array([0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ])

    // 创建缓冲区对象
    if (!bindBuffer(gl, vertices, 'a_Position')) {
        return -1
    }
    if (!bindBuffer(gl, colors, 'a_Color')) {
        return -1
    }
    if (!bindBuffer(gl, normals, 'a_Normal')) {
        return -1
    }
    const indicesBuffer = gl.createBuffer();
    if (!indicesBuffer) {
        console.log('创建缓冲区失败')
        return false;
    }
    // 将顶点索引写入缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return indices.length
}

// 配置缓冲区
function bindBuffer(gl, data, attribute) {
    // 创建缓冲区
    const attributeBuffer = gl.createBuffer();
    if (!attributeBuffer) {
        console.log('创建缓冲区失败')
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    // 顶点坐标
    const a_attribute = gl.getAttribLocation(gl.program, attribute)
    if (a_attribute < 0) {
        console.log(attribute+'获取失败')
        return false;
    }
    gl.vertexAttribPointer(a_attribute, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(a_attribute)
    return true
}

main()
