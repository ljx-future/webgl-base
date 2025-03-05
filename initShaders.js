export function initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE) {
    const program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE)
    if (!program) {
        return false
    }
    gl.program = program
    gl.useProgram(program)
    return true
}

export function createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE)
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE)
    if (!vertexShader || !fragmentShader) {
        return null;
    }
    // 创建程序对象
    const program = gl.createProgram()
    if (!program) {
        return null;
    }
    // 将程序对象分配顶点着色器和片元着色器
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    // 链接着色器
    gl.linkProgram(program);
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (!linked) {
        gl.deleteProgram(program);
        gl.deleteShader(fragmentShader)
        gl.deleteShader(vertexShader)
        console.log('failed 链接着色器')
        return null;
    }
    return program
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (shader === null) {
        console.log('failed loadShader')
        return null;
    }
    // 设置着色器的源代码
    gl.shaderSource(shader, source)
    //  编辑着色器
    gl.compileShader(shader)
    // 检查是否编译成功
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
        const error = gl.getShaderInfoLog(shader)
        console.log(source+'failed compiled：' + error)
        gl.deleteShader(shader)
        return null;
    }
    return shader
}
