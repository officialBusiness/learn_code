import { ShaderLanguage } from "../../Materials/shaderLanguage.js";
import { InjectStartingAndEndingCode } from "../../Misc/codeStringParsingTools.js";
const varyingRegex = /(flat\s)?\s*varying\s*.*/;
/** @internal */
export class NativeShaderProcessor {
    constructor() {
        this.shaderLanguage = ShaderLanguage.GLSL;
    }
    initializeShaders(processingContext) {
        this._nativeProcessingContext = processingContext;
        if (this._nativeProcessingContext) {
            this._nativeProcessingContext.remappedAttributeNames = {};
            this._nativeProcessingContext.injectInVertexMain = "";
        }
    }
    attributeProcessor(attribute) {
        if (!this._nativeProcessingContext) {
            return attribute.replace("attribute", "in");
        }
        const attribRegex = /\s*(?:attribute|in)\s+(\S+)\s+(\S+)\s*;/gm;
        const match = attribRegex.exec(attribute);
        if (match !== null) {
            const attributeType = match[1];
            const name = match[2];
            const numComponents = this._nativeProcessingContext.vertexBufferKindToNumberOfComponents[name];
            if (numComponents !== undefined) {
                // Special case for an int/ivecX vertex buffer that is used as a float/vecX attribute in the shader.
                const newType = numComponents < 0 ? (numComponents === -1 ? "int" : "ivec" + -numComponents) : numComponents === 1 ? "uint" : "uvec" + numComponents;
                const newName = `_int_${name}_`;
                attribute = attribute.replace(match[0], `in ${newType} ${newName}; ${attributeType} ${name};`);
                this._nativeProcessingContext.injectInVertexMain += `${name} = ${attributeType}(${newName});\n`;
                this._nativeProcessingContext.remappedAttributeNames[name] = newName;
            }
            else {
                attribute = attribute.replace(match[0], `in ${attributeType} ${name};`);
            }
        }
        return attribute;
    }
    varyingCheck(varying, _isFragment) {
        return varyingRegex.test(varying);
    }
    varyingProcessor(varying, isFragment) {
        return varying.replace("varying", isFragment ? "in" : "out");
    }
    postProcessor(code, defines, isFragment) {
        const hasDrawBuffersExtension = code.search(/#extension.+GL_EXT_draw_buffers.+require/) !== -1;
        // Remove extensions
        const regex = /#extension.+(GL_OVR_multiview2|GL_OES_standard_derivatives|GL_EXT_shader_texture_lod|GL_EXT_frag_depth|GL_EXT_draw_buffers).+(enable|require)/g;
        code = code.replace(regex, "");
        // Replace instructions
        code = code.replace(/texture2D\s*\(/g, "texture(");
        if (isFragment) {
            const hasOutput = code.search(/layout *\(location *= *0\) *out/g) !== -1;
            code = code.replace(/texture2DLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCubeLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCube\s*\(/g, "texture(");
            code = code.replace(/gl_FragDepthEXT/g, "gl_FragDepth");
            code = code.replace(/gl_FragColor/g, "glFragColor");
            code = code.replace(/gl_FragData/g, "glFragData");
            code = code.replace(/void\s+?main\s*\(/g, (hasDrawBuffersExtension || hasOutput ? "" : "layout(location = 0) out vec4 glFragColor;\n") + "void main(");
        }
        else {
            if (this._nativeProcessingContext?.injectInVertexMain) {
                code = InjectStartingAndEndingCode(code, "void main", this._nativeProcessingContext.injectInVertexMain);
            }
            const hasMultiviewExtension = defines.indexOf("#define MULTIVIEW") !== -1;
            if (hasMultiviewExtension) {
                return "#extension GL_OVR_multiview2 : require\nlayout (num_views = 2) in;\n" + code;
            }
        }
        return code;
    }
}
//# sourceMappingURL=nativeShaderProcessors.js.map