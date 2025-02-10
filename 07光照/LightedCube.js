// 顶点着色器
import {initShaders} from "../initShaders.js";
import Matrix4 from "../Matrix4.js";
let VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' +        // 法向量
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform vec3 u_LightColor;\n' +     // 光线颜色
    'uniform vec3 u_LightDirection;\n' + // 归一化的世界坐标 (in the world coordinate, normalized)
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position ;\n' +
    // Make the length of the normal 1.0
    '  vec3 normal = normalize(a_Normal.xyz);\n' +
    // Dot product of the light direction and the orientation of a surface (the normal)
    '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
    // Calculate the color due to diffuse reflection
    '  vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;\n' +
    '  v_Color = vec4(diffuse, a_Color.a);\n' +
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
        let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
        let u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
        if (!u_MvpMatrix || !u_LightColor || !u_LightDirection) {
            console.log('Failed to get the storage location');
            return;
        }

        // 光线颜色
        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
        // 设置归一化世界坐标 (在世界坐标系)
        let lightDirection = new Vector3([0.5, 3.0, 4.0]);
        lightDirection.normalize();     // 归一化
        gl.uniform3fv(u_LightDirection, lightDirection.elements);
        // 模型视图投影矩阵
        const mvpMatrix = new Matrix4()
        mvpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
        mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0)
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.matrix)

        // 清除深度缓冲区   深度缓冲区 也称Z缓冲区
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        // 绘制图形
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    }
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
        1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
        0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0   // v4-v7-v6-v5 back
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
